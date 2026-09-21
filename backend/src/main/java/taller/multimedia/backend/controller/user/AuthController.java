package taller.multimedia.backend.controller.user;

import jakarta.validation.Valid;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import taller.multimedia.backend.dto.AuthResult;
import taller.multimedia.backend.dto.ForgotPasswordRequest;
import taller.multimedia.backend.dto.LoginRequest;
import taller.multimedia.backend.dto.MessageResponse;
import taller.multimedia.backend.dto.ResetPasswordRequest;
import taller.multimedia.backend.dto.SignupRequest;
import taller.multimedia.backend.dto.SigninResponse;
import taller.multimedia.backend.security.jwt.JwtUtils;
import taller.multimedia.backend.security.services.UserDetailsImpl;
import taller.multimedia.backend.service.user.AuthService;

//Controller class for handling authentication-related endpoints

/*
Antes
@CrossOrigin(origins = "*", maxAge = 3600) // Allow cross-origin requests from any origin with a maximum age of 3600 seconds
*/

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtils jwtUtils;

    /*
     * ANTES (solo authService):
     * public AuthController(AuthService authService) {
     * this.authService = authService;
     * }
     */

    // NUEVO: se agrega JwtUtils para generar el token y devolverlo también en el
    // body
    public AuthController(AuthService authService, JwtUtils jwtUtils) {
        this.authService = authService;
        this.jwtUtils = jwtUtils;
    }

    // Endpoint for user authentication (login)
    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResult result = authService.authenticateUser(loginRequest);

        // Get the authenticated user details to generate JWT cookie
        UserDetailsImpl userDetails = result.getUserDetails();

        String token = jwtUtils.generateJwtToken(userDetails);
        ResponseCookie jwtCookie = ResponseCookie.from("jwt", token)
                .path("/")
                .maxAge(24 * 60 * 60)
                .httpOnly(true)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                /*
                 * ANTES: devolvía solo el user en el body
                 * .body(user);
                 */
                // NUEVO: envuelve token + user en SigninResponse
                .body(new SigninResponse(token, result.getUserInfo()));
    }

    // Endpoint for user registration (signup) - only ADMIN can register new users
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
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
            // 1. Generar token único de recuperación
            // 2. Guardarlo en base de datos con expiración
            // 3. Enviar el correo inmediatamente al usuario específico
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