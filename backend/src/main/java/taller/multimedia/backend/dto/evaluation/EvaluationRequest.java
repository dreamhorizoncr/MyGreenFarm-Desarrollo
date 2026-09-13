package taller.multimedia.backend.dto.evaluation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class EvaluationRequest {

    @NotNull(message = "El ID del expediente es obligatorio")
    private UUID expedientId;

    @NotNull(message = "La fecha de evaluación es obligatoria")
    private LocalDate evaluationDate;

    @NotBlank(message = "El progreso de comunicación es obligatorio")
    @Size(max = 2000, message = "El progreso de comunicación no puede superar los 2000 caracteres")
    private String communicationProgress;

    @NotBlank(message = "El progreso de lenguaje es obligatorio")
    @Size(max = 2000, message = "El progreso de lenguaje no puede superar los 2000 caracteres")
    private String languageProgress;

    @NotBlank(message = "El progreso de lectura es obligatorio")
    @Size(max = 2000, message = "El progreso de lectura no puede superar los 2000 caracteres")
    private String readingProgress;

    @NotBlank(message = "El progreso motor es obligatorio")
    @Size(max = 2000, message = "El progreso motor no puede superar los 2000 caracteres")
    private String motorProgress;

    @NotBlank(message = "La observación del profesor es obligatoria")
    @Size(max = 3000, message = "La observación no puede superar los 3000 caracteres")
    private String teacherObservation;
}
