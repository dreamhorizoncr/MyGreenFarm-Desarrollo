package taller.multimedia.backend.repository.curriculum;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.curriculum.Curriculum;

import java.util.UUID;
import java.util.List;
import java.time.LocalDateTime;
import taller.multimedia.backend.model.curriculum.CurriculumStatus;

@Repository
public interface CurriculumRepository extends JpaRepository<Curriculum, UUID> {
    List<Curriculum> findByStatusAndSubmittedAtAfterOrderBySubmittedAtDesc(
            CurriculumStatus status, LocalDateTime submittedAt);
}
