package taller.multimedia.backend.service.user;


import java.time.LocalDate;
import java.time.LocalDateTime;

import java.util.UUID;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import jakarta.transaction.Transactional;
import taller.multimedia.backend.dto.AuthResult;
import taller.multimedia.backend.dto.LoginRequest;
import taller.multimedia.backend.dto.SignupRequest;
import taller.multimedia.backend.dto.UserInfoResponse;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.user.UserRepository;
import taller.multimedia.backend.security.jwt.JwtUtils;
import taller.multimedia.backend.security.services.UserDetailsImpl;
import taller.multimedia.backend.service.EmailService;
import taller.multimedia.backend.service.appointment.CalendarSyncAsyncService;
import taller.multimedia.backend.util.Sanitizer;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder; // Password encoder for hashing passwords
    private final AuthenticationManager authenticationManager; // Authentication manager for handling authentication
    private final JwtUtils jwtUtils; // Utility class for generating and validating JWT tokens
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

   @Transactional
public void registerUser(SignupRequest request) {
    String email = Sanitizer.requireClean("email", request.getEmail());
    String firstName = Sanitizer.requireClean("firstName", request.getFirstName());
    String lastName = Sanitizer.requireClean("lastName", request.getLastName());
    LocalDate birthday = request.getBirthday();

    if (userRepository.existsByEmail(email)) {
        throw new RuntimeException("Error: Email is already in use!");
    }

    Role role = resolveRole(request.getRole()); // defaults to USER if not provided

    // Birthday is optional, but only teachers can have one
    if (birthday != null && role != Role.TEACHER) {
        throw new RuntimeException("Error: Birthday is only allowed for TEACHER role!");
    }

    User user = new User(
            email,
            encoder.encode(request.getPassword()),
            firstName,
            lastName,
            role,
            true
    );
    user.setBirthday(birthday);

    User saved = userRepository.save(user);

    if (saved != null && saved.getBirthday() != null && saved.getId() != null) {
        scheduleBirthdaySync(saved.getId());
    }
}

// Sincroniza con Google Calendar solo después de que se confirme el guardado en la BD
private void scheduleBirthdaySync(UUID userId) {
    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
        @Override
        public void afterCommit() {
            calendarSyncAsyncService.syncBirthdayAsync(userId);
        }
    });
}

    // Authenticate user and return user info
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
                userDetails.getBirthday()
            );

        return new AuthResult(userInfo, userDetails);
    }

    // Generate JWT cookie for authenticated user
    public ResponseCookie generateJwtCookie(UserDetailsImpl userDetails) {
        return jwtUtils.generateJwtCookie(userDetails);
    }

    // Clear JWT cookie on logout
    public ResponseCookie logoutUser() {
        return jwtUtils.getCleanJwtCookie();
    }

    // Resolve role from string, default to TEACHER if not provided or invalid
    private Role resolveRole(String strRole) {
    if (strRole == null) {
        return Role.TEACHER;
    }

    try {
        Role role = Role.valueOf(strRole.toUpperCase());

        if (role == Role.OWNER) {
            throw new RuntimeException("The OWNER role cannot be assigned");
        }

        return role;
    } catch (IllegalArgumentException e) {
        return Role.TEACHER;
    }
}

    public void forgotPassword(String email) {
        String cleanEmail = Sanitizer.requireClean("email", email);
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setTokenExpirationDate(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new RuntimeException("Token inválido"));

        if (user.getTokenExpirationDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("La sesión ha expirado");
        }

        user.setPassword(encoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setTokenExpirationDate(null);
        userRepository.save(user);
    }
}