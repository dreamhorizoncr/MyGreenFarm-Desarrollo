package taller.multimedia.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Data;

// DTO class for signup request payload
@Data
public class SignupRequest {
@NotBlank(message = "Email is required")
@Pattern(
    regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.(com|go\\.cr)$",
    message = "The email must end in .com or .go.cr"
)
    private String email;

@NotBlank(message = "The password is required")
@Size(min = 8, message = "The password must have at least 8 characters")
@Pattern(
    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$",
    message = "The password must include uppercase, lowercase, number and symbol"
)
    private String password;

@NotBlank(message = "First name is required")
    private String firstName;

@NotBlank(message = "Last name is required")
    private String lastName;

    private String role;

}