package taller.multimedia.backend.service.user;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

import taller.multimedia.backend.dto.auth.LoginRequest;
import taller.multimedia.backend.dto.auth.SignupRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.user.UserRepository;
import taller.multimedia.backend.security.jwt.JwtUtils;
import taller.multimedia.backend.security.service.UserDetailsImpl;
import taller.multimedia.backend.service.email.EmailService;
import taller.multimedia.backend.util.HashUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder encoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    @Test
    void registerUser_trimsLegitimateNamesButKeepsThePasswordUntouched() {
        SignupRequest request = new SignupRequest();
        request.setEmail("  ana@ucr.ac.cr  ");
        request.setPassword("Sup3r$ecret!");
        request.setFirstName("  Ana   José  ");
        request.setLastName("  Pérez   Ltda  ");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(encoder.encode("Sup3r$ecret!")).thenReturn("hashed-password");

        authService.registerUser(request);

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUser.capture());

        User user = savedUser.getValue();
        assertThat(user.getEmail()).isEqualTo("ana@ucr.ac.cr");
        assertThat(user.getFirstName()).isEqualTo("Ana José");
        assertThat(user.getLastName()).isEqualTo("Pérez Ltda");
        assertThat(user.getPassword()).isEqualTo("hashed-password");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "<script>alert(1)</script>ana@ucr.ac.cr",
            "<b>Ana</b>",
            "Ana\u0000José",
    })
    void registerUser_rejectsFieldsWithHtmlOrControlCharactersAndNeverSaves(String maliciousValue) {
        SignupRequest request = new SignupRequest();
        request.setEmail(maliciousValue);
        request.setPassword("Sup3r$ecret!");
        request.setFirstName("Ana");
        request.setLastName("Pérez");

        assertThrows(InvalidFieldException.class, () -> authService.registerUser(request));

        verify(userRepository, never()).save(any());
    }

    @Test
    void authenticateUser_trimsTheEmailButKeepsThePasswordUntouched() {
        LoginRequest request = new LoginRequest();
        request.setEmail("  owner@ejemplo.com  ");
        request.setPassword("<b>notAPassword</b>");

        UserDetailsImpl userDetails = new UserDetailsImpl(
                UUID.randomUUID(), "owner@ejemplo.com", "hashed-password", "Owner", "Test",
                Role.OWNER.name(), true, null, null, List.of(new SimpleGrantedAuthority("ROLE_OWNER")));

        Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);

        authService.authenticateUser(request);

        ArgumentCaptor<UsernamePasswordAuthenticationToken> tokenCaptor =
                ArgumentCaptor.forClass(UsernamePasswordAuthenticationToken.class);
        verify(authenticationManager).authenticate(tokenCaptor.capture());

        assertThat(tokenCaptor.getValue().getPrincipal()).isEqualTo("owner@ejemplo.com");
        assertThat(tokenCaptor.getValue().getCredentials()).isEqualTo("<b>notAPassword</b>");
    }

    @Test
    void authenticateUser_rejectsAMaliciousEmailAndNeverCallsTheAuthenticationManager() {
        LoginRequest request = new LoginRequest();
        request.setEmail("<script>x</script>owner@ejemplo.com");
        request.setPassword("whatever");

        assertThrows(InvalidFieldException.class, () -> authService.authenticateUser(request));

        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void forgotPassword_looksUpTheTrimmedEmail() {
        User user = new User("owner@ejemplo.com", "hashed-password");

        when(userRepository.findByEmail("owner@ejemplo.com")).thenReturn(Optional.of(user));

        authService.forgotPassword("  owner@ejemplo.com  ");

        verify(userRepository).findByEmail("owner@ejemplo.com");
        verify(emailService).sendPasswordResetEmail(eq("owner@ejemplo.com"), anyString());
    }

    @Test
    void forgotPassword_storesOnlyTheHashOfTheTokenItEmails() {
        User user = new User("owner@ejemplo.com", "hashed-password");
        when(userRepository.findByEmail("owner@ejemplo.com")).thenReturn(Optional.of(user));

        authService.forgotPassword("owner@ejemplo.com");

        ArgumentCaptor<String> emailedToken = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordResetEmail(eq("owner@ejemplo.com"), emailedToken.capture());
        assertThat(user.getResetPasswordToken())
                .isNotEqualTo(emailedToken.getValue())
                .isEqualTo(HashUtils.sha256(emailedToken.getValue()));
    }

    @Test
    void forgotPassword_doesNotRevealWhetherTheEmailHasAnAccount() {
        when(userRepository.findByEmail("nobody@ejemplo.com")).thenReturn(Optional.empty());

        authService.forgotPassword("nobody@ejemplo.com");

        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
    }

    @Test
    void resetPassword_findsTheUserByTheHashOfTheTokenAndClearsIt() {
        User user = new User("owner@ejemplo.com", "old-hash");
        user.setResetPasswordToken(HashUtils.sha256("emailed-token"));
        user.setTokenExpirationDate(java.time.LocalDateTime.now().plusMinutes(5));
        when(userRepository.findByResetPasswordToken(HashUtils.sha256("emailed-token"))).thenReturn(Optional.of(user));
        when(encoder.encode("N3w$ecret!")).thenReturn("new-hash");

        authService.resetPassword("emailed-token", "N3w$ecret!");

        assertThat(user.getPassword()).isEqualTo("new-hash");
        assertThat(user.getResetPasswordToken()).isNull();
        assertThat(user.getTokenExpirationDate()).isNull();
    }

    @Test
    void forgotPassword_rejectsAMaliciousEmailAndNeverLooksItUp() {
        assertThrows(InvalidFieldException.class, () -> authService.forgotPassword("<script>x</script>owner@ejemplo.com"));

        verify(userRepository, never()).findByEmail(anyString());
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
    }
}
