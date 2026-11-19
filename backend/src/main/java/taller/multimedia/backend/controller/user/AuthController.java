package taller.multimedia.backend.controller.user;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import taller.multimedia.backend.dto.auth.AuthResult;
import taller.multimedia.backend.dto.auth.ForgotPasswordRequest;
import taller.multimedia.backend.dto.auth.LoginRequest;
import taller.multimedia.backend.dto.common.MessageResponse;
import taller.multimedia.backend.dto.auth.ResetPasswordRequest;
import taller.multimedia.backend.dto.auth.SignupRequest;
import taller.multimedia.backend.dto.auth.SigninResponse;
import taller.multimedia.backend.security.jwt.JwtUtils;
import taller.multimedia.backend.security.service.UserDetailsImpl;
import taller.multimedia.backend.service.user.AuthService;

/**
 * Sign-in, sign-out, staff registration and password recovery.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtils jwtUtils;

    public AuthController(AuthService authService, JwtUtils jwtUtils) {
        this.authService = authService;
        this.jwtUtils = jwtUtils;
    }

    /**
     * {@code POST /api/auth/signin}
     *
     * @param loginRequest email and password
     * @return the JWT and the user's data, plus the same JWT in an HTTP-only cookie; 401 if the
     *     credentials are wrong
     */
    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResult result = authService.authenticateUser(loginRequest);

        UserDetailsImpl userDetails = result.getUserDetails();

        String token = jwtUtils.generateJwtToken(userDetails);
        ResponseCookie jwtCookie = jwtUtils.generateJwtCookie(token);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .body(new SigninResponse(token, result.getUserInfo()));
    }

    /**
     * {@code POST /api/auth/signup}, owner and admins: creates a staff user.
     *
     * @param signUpRequest user data
     * @return the new user's ID, or 400 with the reason
     */
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        try {
            UUID id = authService.registerUser(signUpRequest);
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("message", "User registered successfully!");
            body.put("id", id);
            return ResponseEntity.ok(body);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new MessageResponse("Error: Unexpected error"));
        }
    }

    /**
     * {@code POST /api/auth/signout}
     *
     * @return a confirmation and an expired cookie that removes the session
     */
    @PostMapping("/signout")
    public ResponseEntity<?> logoutUser() {
        ResponseCookie cookie = authService.logoutUser();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new MessageResponse("You've been signed out!"));
    }

    /**
     * {@code POST /api/auth/forgot-password}: emails a reset link valid for 15 minutes.
     *
     * @param request user's email
     * @return a confirmation, or 400 with the reason
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request.getEmail());

            return ResponseEntity.ok(new MessageResponse("Recovery email sent successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * {@code POST /api/auth/reset-password}
     *
     * @param request reset token and new password
     * @return a confirmation, or 400 if the token is invalid or expired
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(new MessageResponse("Password updated successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}