package taller.multimedia.backend.repository.evaluation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.evaluation.Evaluation;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, UUID> {
    List<Evaluation> findByExpedientIdId(UUID expedientId);

    List<Evaluation> findByExpedientIdIdAndEvaluationDateAfter(UUID expedientId, LocalDate date);

    List<Evaluation> findByExpedientIdIdAndEvaluationDateAfterOrderByEvaluationDateAsc(UUID expedientId, LocalDate date);

}