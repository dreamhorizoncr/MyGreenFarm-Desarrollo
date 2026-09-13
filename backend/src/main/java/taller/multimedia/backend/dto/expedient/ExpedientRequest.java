package taller.multimedia.backend.dto.expedient;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import taller.multimedia.backend.model.expedient.EducationalLevel;

import java.time.LocalDate;

@Data
public class ExpedientRequest {

    @NotBlank(message = "El nombre del niño o niña es obligatorio")
    @Size(min = 2, max = 150, message = "El nombre debe tener entre 2 y 150 caracteres")
    private String childName;

    @NotNull(message = "La fecha de admisión es obligatoria")
    private LocalDate admisionDate;

    @NotNull(message = "El nivel educativo es obligatorio")
    private EducationalLevel educationalLevel;

    @Size(max = 600, message = "Las observaciones generales no pueden superar los 600 caracteres")
    private String generalObservations;
}
