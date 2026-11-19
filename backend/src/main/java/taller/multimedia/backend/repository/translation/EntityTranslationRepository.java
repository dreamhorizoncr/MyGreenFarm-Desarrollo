package taller.multimedia.backend.repository.translation;
import org.springframework.data.jpa.repository.JpaRepository;
import taller.multimedia.backend.model.translation.EntityTranslation;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

/**
 * Storage of the cached translations of site content.
 */
public interface EntityTranslationRepository extends JpaRepository<EntityTranslation, UUID> {

    Optional<EntityTranslation> findFirstByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(
        String entityType, UUID entityId, String fieldName, String languageCode
    );

    List<EntityTranslation> findByEntityTypeAndLanguageCode(String entityType, String languageCode);
}
