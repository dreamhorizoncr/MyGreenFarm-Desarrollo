package taller.multimedia.backend.dto.vacancy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class VacancyRequest {

    @NotBlank(message = "El título es obligatorio")
    @Size(max = 150, message = "El título no puede superar los 150 caracteres")
    private String title;

    @NotBlank(message = "La descripción es obligatoria")
    private String description;

    // Valores esperados: applicantPhone, file, certificates
    @NotNull(message = "Los campos requeridos son obligatorios")
    private List<String> requiredFields;
}
