package taller.multimedia.backend.model.evaluation;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taller.multimedia.backend.model.expedient.Expedient;

@Entity 
@Table (name = "evaluation")
@Data 
@NoArgsConstructor 
@AllArgsConstructor 
public class Evaluation {
    @Id 
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name= "evaluation_date", nullable = false)
    private LocalDate evaluationDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expedient_id", nullable = false)
    private Expedient expedientId;

    @Column(name = "communication_progress", nullable = false, length = 2000)
    private String communicationProgress;

    @Column(name = "language_progress", nullable = false, length = 2000)
    private String languageProgress;

    @Column(name = "reading_progress", nullable = false, length = 2000)
    private String readingProgress;

    @Column(name = "motor_progress", nullable = false, length = 2000)
    private String motorProgress;

    @Column(name = "teacher_observation", nullable = false, length = 3000)
    private String teacherObservation;
}
