package taller.multimedia.backend.controller;

import jakarta.validation.Valid;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import taller.multimedia.backend.dto.ForgotPasswordRequest;
import taller.multimedia.backend.dto.LoginRequest;
import taller.multimedia.backend.dto.MessageResponse;
import taller.multimedia.backend.dto.ResetPasswordRequest;
import taller.multimedia.backend.dto.SignupRequest;
import taller.multimedia.backend.dto.UserInfoResponse;
import taller.multimedia.backend.security.services.UserDetailsImpl;
import taller.multimedia.backend.service.AuthService;

//Controller class for handling authentication-related endpoints
@CrossOrigin(origins = "*", maxAge = 3600) // Allow cross-origin requests from any origin with a maximum age of 3600 seconds
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Endpoint for user authentication (login)
    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        UserInfoResponse user = authService.authenticateUser(loginRequest);

        // Get the authenticated user details to generate JWT cookie
        UserDetailsImpl userDetails = (UserDetailsImpl) org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        ResponseCookie jwtCookie = authService.generateJwtCookie(userDetails);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .body(user);
    }

    // Endpoint for user registration (signup)
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        try {
            authService.registerUser(signUpRequest);
            return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new MessageResponse("Error: Unexpected error"));
        }
    }

    // Endpoint for user logout (signout)
    @PostMapping("/signout")
    public ResponseEntity<?> logoutUser() {
        ResponseCookie cookie = authService.logoutUser();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new MessageResponse("You've been signed out!"));
    }

    // Endpoint para solicitar la recuperación de contraseña
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request.getEmail());
            return ResponseEntity.ok(new MessageResponse("Correo de recuperación enviado con éxito."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    // Endpoint para restablecer la contraseña con el token
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(new MessageResponse("Contraseña actualizada exitosamente."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}