package taller.multimedia.backend.dto.translation;
import java.util.UUID;

public record TranslationItem (
    UUID entityId,
    String fieldName,
    String originalText
){}
