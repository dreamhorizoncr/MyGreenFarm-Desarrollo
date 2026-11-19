package taller.multimedia.backend.dto.translation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * One field to translate in a {@link TranslationBatchRequest}.
 *
 * @param entityId entity ID, a UUID or a number
 * @param fieldName translated field
 * @param originalText text in Spanish
 */
public record TranslationItem(
    @NotBlank String entityId,
    @NotBlank String fieldName,
    @NotNull String originalText
) {}
