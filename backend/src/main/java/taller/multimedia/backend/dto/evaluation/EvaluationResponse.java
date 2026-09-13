package taller.multimedia.backend.dto.evaluation;

import java.time.LocalDate;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@Builder 
@AllArgsConstructor 
@NoArgsConstructor 
public class EvaluationResponse {
    private UUID id;
    private LocalDate evaluationDate;
    private UUID expedientId;
    private String communicationProgress;
    private String languageProgress;
    private String readingProgress;
    private String motorProgress;
    private String teacherObservation;
}
