package taller.multimedia.backend.repository.curriculum;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.curriculum.Curriculum;

import java.util.UUID;

@Repository
public interface CurriculumRepository extends JpaRepository<Curriculum, UUID> {
}
