package taller.multimedia.backend.repository.translation;
import org.springframework.data.jpa.repository.JpaRepository;
import taller.multimedia.backend.model.translations.EntityTranslation;
import java.util.Optional;
import java.util.UUID;

public interface EntityTranslationRepository extends JpaRepository<EntityTranslation, UUID> {

    Optional<EntityTranslation> findByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(
        String entityType, UUID entityId, String fieldName, String languageCode
    );
}
