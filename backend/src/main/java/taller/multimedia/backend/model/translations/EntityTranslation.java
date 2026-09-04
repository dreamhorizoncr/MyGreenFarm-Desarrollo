package taller.multimedia.backend.model.translations;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import lombok.Data;

@Entity
@Table(name = "entity_translations")
@Data
public class EntityTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "language_code", nullable = false)
    private String languageCode;

    @Column(name = "field_name", nullable = false)
    private String fieldName;

    @Column(name = "translated_text", nullable = false)
    private String translatedText;
}
