package taller.multimedia.backend.repository.evaluation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import taller.multimedia.backend.model.evaluation.Evaluation;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Storage of student evaluations.
 */
public interface EvaluationRepository extends JpaRepository<Evaluation, UUID> {
    List<Evaluation> findByExpedientId(UUID expedientId);

    /**
     * @param childIds children to include
     * @return the evaluations of those children's records
     */
    @Query("SELECT e FROM Evaluation e WHERE e.expedient.child.id IN :childIds")
    List<Evaluation> findByChildIds(@Param("childIds") Collection<Long> childIds);

    List<Evaluation> findByExpedientIdAndEvaluationDateAfterOrderByEvaluationDateAsc(UUID expedientId, LocalDate date);

}