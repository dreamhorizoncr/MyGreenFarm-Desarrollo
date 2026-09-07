package taller.multimedia.backend.dto;
import java.util.UUID;

public record TranslationRequest(
    String entityType,
    UUID entityId,
    String fieldName,
    String originalText,
    String targetLanguage
) {}
