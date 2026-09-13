package taller.multimedia.backend.dto.evaluation;

import java.time.LocalDate;
import java.util.UUID;


public class EvaluationResponse {
    private UUID id;
    private LocalDate evaluationDate;
    private UUID expedientId;
    private String communicationProgress;
    private String languageProgress;
    private String readingProgress;
    private String motorProgress;
    private String teacherObservation;

    public EvaluationResponse(UUID id, LocalDate evaluationDate, UUID expedientId,
            String communicationProgress, String languageProgress,
            String readingProgress, String motorProgress, String teacherObservation) {
        this.id = id;
        this.evaluationDate = evaluationDate;
        this.expedientId = expedientId;
        this.communicationProgress = communicationProgress;
        this.languageProgress = languageProgress;
        this.readingProgress = readingProgress;
        this.motorProgress = motorProgress;
        this.teacherObservation = teacherObservation;
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public LocalDate getEvaluationDate() {
        return evaluationDate;
    }

    public UUID getExpedientId() {
        return expedientId;
    }

    public String getCommunicationProgress() {
        return communicationProgress;
    }

    public String getLanguageProgress() {
        return languageProgress;
    }

    public String getReadingProgress() {
        return readingProgress;
    }

    public String getMotorProgress() {
        return motorProgress;
    }

    public String getTeacherObservation() {
        return teacherObservation;
    }
}
