package taller.multimedia.backend.dto.curriculum;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class ApplicationRequest {

    private UUID vacancyId;

    @NotBlank(message = "The name is required")
    @Size(max = 150, message = "The name cannot exceed 150 characters")
    private String applicantName;

    @NotBlank(message = "The email is required")
    @Email(message = "The email format is not valid")
    private String applicantEmail;

    private String applicantPhone;

    private String language;
}
