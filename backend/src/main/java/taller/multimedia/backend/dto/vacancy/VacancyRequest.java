package taller.multimedia.backend.dto.vacancy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class VacancyRequest {

    @NotBlank(message = "The title is required")
    @Size(max = 150, message = "The title cannot exceed 150 characters")
    private String title;

    @NotBlank(message = "The description is required")
    private String description;

    @NotNull(message = "The required fields must be filled in")
    private List<String> requiredFields;
}
