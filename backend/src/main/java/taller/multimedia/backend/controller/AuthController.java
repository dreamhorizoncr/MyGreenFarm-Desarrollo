package taller.multimedia.backend.controller;

import jakarta.validation.Valid;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import taller.multimedia.backend.dto.LoginRequest;
import taller.multimedia.backend.dto.MessageResponse;
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

    // Endpoint for user registration (signup) - only ADMIN can register new users
    @PreAuthorize("hasRole('ADMIN')")
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
}