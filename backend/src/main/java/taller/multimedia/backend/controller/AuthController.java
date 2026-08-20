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

import taller.multimedia.backend.dto.LoginRequest;
import taller.multimedia.backend.dto.MessageResponse;
import taller.multimedia.backend.dto.SignupRequest;
import taller.multimedia.backend.dto.UserInfoResponse;
import taller.multimedia.backend.dto.SigninResponse;
import taller.multimedia.backend.security.jwt.JwtUtils;
import taller.multimedia.backend.security.services.UserDetailsImpl;
import taller.multimedia.backend.service.AuthService;

//Controller class for handling authentication-related endpoints

/*
Antes
@CrossOrigin(origins = "*", maxAge = 3600) // Allow cross-origin requests from any origin with a maximum age of 3600 seconds
*/

// AHORA: esto es para permitir solicitudes desde el frontend en localhost:5173 y permitir el envío de cookies
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true", maxAge = 3600)

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtils jwtUtils;

    /*  ANTES (solo authService):
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    */

    // NUEVO: se agrega JwtUtils para generar el token y devolverlo también en el body
    public AuthController(AuthService authService, JwtUtils jwtUtils) {
        this.authService = authService;
        this.jwtUtils = jwtUtils;
    }

    // Endpoint for user authentication (login)
    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        UserInfoResponse user = authService.authenticateUser(loginRequest);

        // Get the authenticated user details to generate JWT cookie
        UserDetailsImpl userDetails = (UserDetailsImpl) org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        ResponseCookie jwtCookie = authService.generateJwtCookie(userDetails);

        // NUEVO: genera el token para devolverlo también en el body, no solo en la cookie
        String token = jwtUtils.generateJwtToken(userDetails);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                /*  ANTES: devolvía solo el user en el body
                .body(user);
                */
                // NUEVO: envuelve token + user en SigninResponse
                .body(new SigninResponse(token, user));
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
}