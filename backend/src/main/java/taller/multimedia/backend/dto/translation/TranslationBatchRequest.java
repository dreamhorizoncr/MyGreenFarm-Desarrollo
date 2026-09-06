package taller.multimedia.backend.dto.translation;

import java.util.List;

public record TranslationBatchRequest (
    String entityType,
    String targetLanguage,
    List<TranslationItem> items
){}
