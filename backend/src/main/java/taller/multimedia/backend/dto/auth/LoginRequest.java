package taller.multimedia.backend.dto.auth;

import lombok.Data;

/**
 * Sign-in credentials.
 */
@Data
public class LoginRequest {
    private String email;
    private String password;
}