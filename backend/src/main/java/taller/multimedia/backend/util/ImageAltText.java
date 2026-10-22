package taller.multimedia.backend.util;

import java.util.List;

import taller.multimedia.backend.exception.InvalidFieldException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

// Texto alternativo de las imágenes que suben los administradores (lectores de pantalla)
public final class ImageAltText {

    public static final int MAX_LENGTH = 140;
    private static final String FIELD = "altText";

    private ImageAltText() {
    }

    // Vacío se guarda como null; si viene, se valida largo y contenido seguro
    public static String clean(String value) {
        if (value == null || value.isBlank()) return null;
        String trimmed = value.trim();
        if (trimmed.length() > MAX_LENGTH) {
            throw new InvalidFieldException(FIELD, "El texto alternativo debe tener como máximo " + MAX_LENGTH + " caracteres.");
        }
        return Sanitizer.requireClean(FIELD, trimmed);
    }

    // Los textos de una subida múltiple llegan como arreglo JSON (una lista simple partiría los textos con comas)
    public static List<String> parseList(ObjectMapper objectMapper, String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {
            });
        } catch (RuntimeException e) {
            throw new InvalidFieldException(FIELD, "Los textos alternativos no tienen un formato válido.");
        }
    }

    public static String at(List<String> altTexts, int index) {
        return altTexts != null && index < altTexts.size() ? clean(altTexts.get(index)) : null;
    }
}
