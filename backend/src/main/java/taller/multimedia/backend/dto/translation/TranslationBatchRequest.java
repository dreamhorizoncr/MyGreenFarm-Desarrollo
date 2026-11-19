package taller.multimedia.backend.dto.translation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Request to translate several fields of the same entity type at once.
 *
 * @param entityType type of the translated entities
 * @param targetLanguage language code, for example {@code en}
 * @param items fields to translate
 */
public record TranslationBatchRequest(
    @NotBlank String entityType,
    @NotBlank String targetLanguage,
    @NotNull List<@Valid TranslationItem> items
) {}
