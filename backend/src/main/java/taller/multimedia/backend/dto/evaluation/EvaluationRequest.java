package taller.multimedia.backend.dto.evaluation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class EvaluationRequest {

    @NotNull(message = "The record ID is required")
    private UUID expedientId;

    @NotNull(message = "The evaluation date is required")
    @PastOrPresent(message = "The evaluation date cannot be in the future")
    private LocalDate evaluationDate;

    @NotBlank(message = "The communication progress is required")
    @Size(max = 2000, message = "The communication progress cannot exceed 2000 characters")
    private String communicationProgress;

    @NotBlank(message = "The language progress is required")
    @Size(max = 2000, message = "The language progress cannot exceed 2000 characters")
    private String languageProgress;

    @NotBlank(message = "The reading progress is required")
    @Size(max = 2000, message = "The reading progress cannot exceed 2000 characters")
    private String readingProgress;

    @NotBlank(message = "The motor progress is required")
    @Size(max = 2000, message = "The motor progress cannot exceed 2000 characters")
    private String motorProgress;

    @NotBlank(message = "The teacher's observation is required")
    @Size(max = 3000, message = "The observation cannot exceed 3000 characters")
    private String teacherObservation;
}
