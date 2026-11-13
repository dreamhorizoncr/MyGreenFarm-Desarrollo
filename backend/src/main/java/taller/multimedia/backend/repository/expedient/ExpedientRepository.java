package taller.multimedia.backend.repository.expedient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import taller.multimedia.backend.model.expedient.Expedient;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface ExpedientRepository extends JpaRepository<Expedient, UUID> {

    boolean existsByChildId(Long childId);
    Optional<Expedient> findByChildStudentId(String studentId);

    Optional<Expedient> findByChildId(Long childId);

    boolean existsByChildStudentId(String studentId);

    Page<Expedient> findByChildIsActiveTrue(Pageable pageable);

    @Query("SELECT e FROM Expedient e WHERE e.child.isActive = true AND e.child.id IN :childIds")
    Page<Expedient> findActiveByChildIds(@Param("childIds") Collection<Long> childIds, Pageable pageable);
}
