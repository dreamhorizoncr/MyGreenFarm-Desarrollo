package taller.multimedia.backend.dto.expedient;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import taller.multimedia.backend.model.expedient.EducationalLevel;

import java.time.LocalDate;

@Data
public class ExpedientRequest {

    @NotNull(message = "El carné del niño es obligatorio")
    private String studentId;

    @NotNull(message = "La fecha de admisión es obligatoria")
    private LocalDate admisionDate;

    @NotNull(message = "El nivel educativo es obligatorio")
    private EducationalLevel educationalLevel;

    @Size(max = 600, message = "Las observaciones generales no pueden superar los 600 caracteres")
    private String generalObservations;
}
