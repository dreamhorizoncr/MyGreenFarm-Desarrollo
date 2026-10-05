package taller.multimedia.backend.repository.expedient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.expedient.Expedient;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpedientRepository extends JpaRepository<Expedient, UUID> {

    boolean existsByChildId(Long childId);
    // 2. Buscar expediente por el carné del niño
    Optional<Expedient> findByChildStudentId(String studentId);

    // 3. Buscar expediente directamente por ID de niño
    Optional<Expedient> findByChildId(Long childId);

    boolean existsByChildStudentId(String studentId);
}
