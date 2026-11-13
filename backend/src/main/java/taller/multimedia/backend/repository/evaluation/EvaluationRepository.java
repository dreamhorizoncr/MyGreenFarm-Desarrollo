package taller.multimedia.backend.repository.evaluation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import taller.multimedia.backend.model.evaluation.Evaluation;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface EvaluationRepository extends JpaRepository<Evaluation, UUID> {
    List<Evaluation> findByExpedientIdId(UUID expedientId);

    @Query("SELECT e FROM Evaluation e WHERE e.expedientId.child.id IN :childIds")
    List<Evaluation> findByChildIds(@Param("childIds") Collection<Long> childIds);

    List<Evaluation> findByExpedientIdIdAndEvaluationDateAfter(UUID expedientId, LocalDate date);

    List<Evaluation> findByExpedientIdIdAndEvaluationDateAfterOrderByEvaluationDateAsc(UUID expedientId, LocalDate date);

}