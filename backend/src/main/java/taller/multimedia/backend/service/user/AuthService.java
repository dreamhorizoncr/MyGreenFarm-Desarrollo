package taller.multimedia.backend.service.user;

import java.time.LocalDate;
import java.time.LocalDateTime;

import java.util.Optional;
import java.util.UUID;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import taller.multimedia.backend.dto.auth.AuthResult;
import taller.multimedia.backend.dto.auth.LoginRequest;
import taller.multimedia.backend.dto.auth.SignupRequest;
import taller.multimedia.backend.dto.user.UserInfoResponse;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.user.UserRepository;
import taller.multimedia.backend.security.jwt.JwtUtils;
import taller.multimedia.backend.security.service.UserDetailsImpl;
import taller.multimedia.backend.service.email.EmailService;
import taller.multimedia.backend.service.appointment.CalendarSyncAsyncService;
import taller.multimedia.backend.util.Sanitizer;
import taller.multimedia.backend.util.AfterCommit;
import taller.multimedia.backend.util.HashUtils;

/**
 * Registration of staff users, sign-in with a JWT cookie and password recovery.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;
    private final CalendarSyncAsyncService calendarSyncAsyncService;

    public AuthService(UserRepository userRepository, PasswordEncoder encoder,
            AuthenticationManager authenticationManager, JwtUtils jwtUtils, EmailService emailService,
            CalendarSyncAsyncService calendarSyncAsyncService) {
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.emailService = emailService;
        this.calendarSyncAsyncService = calendarSyncAsyncService;
    }

    /**
     * Creates a staff user. If the user has a birthday, the birthday event is created in Google
     * Calendar after the transaction commits.
     *
     * @param request user data; the role defaults to teacher and only teachers may have a birthday
     * @return the ID of the new user
     * @throws RuntimeException if the email is already in use, the owner role is requested, or a
     *     non-teacher has a birthday
     * @throws taller.multimedia.backend.exception.InvalidFieldException if a field is unsafe
     */
    @Transactional
    public UUID registerUser(SignupRequest request) {
        String email = Sanitizer.requireClean("email", request.getEmail());
        String firstName = Sanitizer.requireClean("firstName", request.getFirstName());
        String lastName = Sanitizer.requireClean("lastName", request.getLastName());
        LocalDate birthday = request.getBirthday();

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        Role role = resolveRole(request.getRole());

        if (birthday != null && role != Role.TEACHER) {
            throw new RuntimeException("Error: Birthday is only allowed for TEACHER role!");
        }

        User user = new User(
                email,
                encoder.encode(request.getPassword()),
                firstName,
                lastName,
                role,
                true);
        user.setBirthday(birthday);
        if (role == Role.TEACHER && Boolean.FALSE.equals(request.getShowOnAboutUs())) {
            user.setShowOnAboutUs(false);
        }

        User saved = userRepository.save(user);

        if (saved != null && saved.getBirthday() != null && saved.getId() != null) {
            scheduleBirthdaySync(saved.getId());
        }
        return saved == null ? null : saved.getId();
    }

    private void scheduleBirthdaySync(UUID userId) {
        AfterCommit.run(() -> calendarSyncAsyncService.syncBirthdayAsync(userId));
    }

    /**
     * Checks the credentials and stores the authentication in the security context.
     *
     * @param request email and password
     * @return the user's data and the details needed to issue the JWT cookie
     * @throws org.springframework.security.core.AuthenticationException if the credentials are
     *     wrong
     */
    public AuthResult authenticateUser(LoginRequest request) {
        String email = Sanitizer.requireClean("email", request.getEmail());
        Authentication authentication = authenticationManager
                .authenticate(new UsernamePasswordAuthenticationToken(email, request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        UserInfoResponse userInfo = new UserInfoResponse(
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getFirstName(),
                userDetails.getLastName(),
                userDetails.getRole(),
                userDetails.getBirthday());

        return new AuthResult(userInfo, userDetails);
    }

    /**
     * @return an empty, expired JWT cookie that removes the session from the browser
     */
    public ResponseCookie logoutUser() {
        return jwtUtils.getCleanJwtCookie();
    }

    /**
     * @param roleName role requested in the form, may be {@code null}
     * @return the requested role, or teacher when it is missing or unknown
     * @throws RuntimeException if the owner role is requested, because it cannot be assigned from
     *     the panel
     */
    private Role resolveRole(String roleName) {
        if (roleName == null) {
            return Role.TEACHER;
        }

        try {
            Role role = Role.valueOf(roleName.toUpperCase());

            if (role == Role.OWNER) {
                throw new RuntimeException("The OWNER role cannot be assigned");
            }

            return role;
        } catch (IllegalArgumentException e) {
            return Role.TEACHER;
        }
    }

    /**
     * Creates a password reset token valid for 15 minutes and emails the reset link. Only the token's
     * SHA-256 hash is stored, so a leaked database cannot be used to reset passwords. If no user has
     * the email, nothing happens, so the form cannot be used to find out which emails have accounts.
     *
     * @param email user's email
     */
    public void forgotPassword(String email) {
        String cleanEmail = Sanitizer.requireClean("email", email);
        Optional<User> found = userRepository.findByEmail(cleanEmail);
        if (found.isEmpty()) {
            // same answer as for a registered email, so the form cannot be used to find accounts
            return;
        }
        User user = found.get();

        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(HashUtils.sha256(token));
        user.setTokenExpirationDate(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    /**
     * Sets a new password using a reset token and invalidates the token.
     *
     * @param token token from the reset email
     * @param newPassword new password, stored hashed
     * @throws RuntimeException if the token does not exist or has expired
     */
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetPasswordToken(HashUtils.sha256(token))
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (user.getTokenExpirationDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("The session has expired");
        }

        user.setPassword(encoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setTokenExpirationDate(null);
        userRepository.save(user);
    }
}