package taller.multimedia.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Email of the user who forgot their password.
 */
@Data
public class ForgotPasswordRequest {
    @NotBlank
    @Email
    private String email;
}
