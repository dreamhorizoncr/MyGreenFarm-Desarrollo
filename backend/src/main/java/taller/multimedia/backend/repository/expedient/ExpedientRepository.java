package taller.multimedia.backend.repository.expedient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.expedient.Expedient;

import java.util.UUID;

@Repository
public interface ExpedientRepository extends JpaRepository<Expedient, UUID> {

    boolean existsByChildId(Long childId);
    boolean existsByChildName(String childName);
}
