package taller.multimedia.backend.repository.expedient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.expedient.Expedient;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpedientRepository extends JpaRepository<Expedient, UUID> {

    boolean existsByChildId(Long childId);
    Optional<Expedient> findByChildStudentId(String studentId);

    Optional<Expedient> findByChildId(Long childId);

    boolean existsByChildStudentId(String studentId);

    Page<Expedient> findByChildIsActiveTrue(Pageable pageable);
}
