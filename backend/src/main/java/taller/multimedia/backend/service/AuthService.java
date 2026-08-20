package taller.multimedia.backend.service;


import java.time.LocalDateTime;

import java.util.UUID;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import taller.multimedia.backend.dto.LoginRequest;
import taller.multimedia.backend.dto.SignupRequest;
import taller.multimedia.backend.dto.UserInfoResponse;
import taller.multimedia.backend.model.Role;
import taller.multimedia.backend.model.User;
import taller.multimedia.backend.repository.UserRepository;
import taller.multimedia.backend.security.jwt.JwtUtils;
import taller.multimedia.backend.security.services.UserDetailsImpl;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder; // Password encoder for hashing passwords
    private final AuthenticationManager authenticationManager; // Authentication manager for handling authentication
    private final JwtUtils jwtUtils; // Utility class for generating and validating JWT tokens

    public AuthService(UserRepository userRepository, PasswordEncoder encoder,
            AuthenticationManager authenticationManager, JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
    }

    // Register a new user
    public void registerUser(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        Role role = resolveRole(request.getRole());  // Resolve the role from the request, defaulting to USER if not provided

        // Create a new user entity
        User user = new User(
                request.getEmail(),
                encoder.encode(request.getPassword()),
                request.getFirstName(),
                request.getLastName(),
                role,
                true);

        userRepository.save(user);
    }

    // Authenticate user and return user info
    public UserInfoResponse authenticateUser(LoginRequest request) {
        Authentication authentication = authenticationManager
                .authenticate(new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        return new UserInfoResponse(
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getFirstName(),
                userDetails.getLastName(),
                userDetails.getRole());
    }

    // Generate JWT cookie for authenticated user
    public ResponseCookie generateJwtCookie(UserDetailsImpl userDetails) {
        return jwtUtils.generateJwtCookie(userDetails);
    }

    // Clear JWT cookie on logout
    public ResponseCookie logoutUser() {
        return jwtUtils.getCleanJwtCookie();
    }

    // Resolve role from string, default to USER
    private Role resolveRole(String strRole) {
        if (strRole == null) {
            return Role.USER;
        }
        try {
            return Role.valueOf(strRole.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Role.USER;
        }
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setTokenExpirationDate(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        // Aquí envías el correo electrónico con el token
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new RuntimeException("Token inválido"));

        if (user.getTokenExpirationDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El token ha expirado");
        }

        user.setPassword(encoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setTokenExpirationDate(null);
        userRepository.save(user);
    }
}