package taller.multimedia.backend.dto.translation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request to translate one field of an entity.
 *
 * @param entityType type of the translated entity, for example {@code announcement}
 * @param entityId entity ID
 * @param fieldName translated field; {@code content} is translated paragraph by paragraph
 * @param originalText text in Spanish
 * @param targetLanguage language code, for example {@code en}
 * @param sourceTextHash hash of the original text sent by older clients; not used
 */
public record TranslationRequest(
    @NotBlank String entityType,
    @NotNull UUID entityId,
    @NotBlank String fieldName,
    @NotNull String originalText,
    @NotBlank String targetLanguage,
    String sourceTextHash
) {}
