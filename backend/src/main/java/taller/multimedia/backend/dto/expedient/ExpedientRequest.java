package taller.multimedia.backend.dto.expedient;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import taller.multimedia.backend.model.expedient.EducationalLevel;

import java.time.LocalDate;

/**
 * Data of a student record. The child is found by student ID.
 */
@Data
public class ExpedientRequest {

    @NotNull(message = "The child's student ID is required")
    private String studentId;

    @NotNull(message = "The admission date is required")
    private LocalDate admissionDate;

    @NotNull(message = "The education level is required")
    private EducationalLevel educationalLevel;

    @Size(max = 600, message = "The general observations cannot exceed 600 characters")
    private String generalObservations;
}
