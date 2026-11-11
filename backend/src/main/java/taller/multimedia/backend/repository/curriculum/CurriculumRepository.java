package taller.multimedia.backend.repository.curriculum;

import org.springframework.data.jpa.repository.JpaRepository;

import taller.multimedia.backend.model.curriculum.Curriculum;
import taller.multimedia.backend.model.curriculum.CurriculumStatus;

import java.util.UUID;
import java.util.List;
import java.time.LocalDateTime;

public interface CurriculumRepository extends JpaRepository<Curriculum, UUID> {
    List<Curriculum> findByStatusAndSubmittedAtAfterOrderBySubmittedAtDesc(
            CurriculumStatus status, LocalDateTime submittedAt);
}
