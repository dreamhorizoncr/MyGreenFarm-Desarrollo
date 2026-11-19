package taller.multimedia.backend.util;

import java.util.List;

import taller.multimedia.backend.exception.InvalidFieldException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/**
 * Alternative texts of uploaded images, for screen readers.
 */
public final class ImageAltText {

    /**
     * Maximum length of an alternative text.
     */
    public static final int MAX_LENGTH = 140;
    private static final String FIELD = "altText";

    private ImageAltText() {
    }

    /**
     * @param value alternative text, may be blank
     * @return the trimmed and sanitized text, or {@code null} when it is blank
     * @throws InvalidFieldException if it is longer than {@link #MAX_LENGTH} or unsafe
     */
    public static String clean(String value) {
        if (value == null || value.isBlank()) return null;
        String trimmed = value.trim();
        if (trimmed.length() > MAX_LENGTH) {
            throw new InvalidFieldException(FIELD, "The alt text must be at most " + MAX_LENGTH + " characters.");
        }
        return Sanitizer.requireClean(FIELD, trimmed);
    }

    /**
     * @param objectMapper JSON reader
     * @param json JSON array of alternative texts sent with a multipart upload, may be blank
     * @return the texts, or an empty list
     * @throws InvalidFieldException if it is not a JSON array of strings
     */
    public static List<String> parseList(ObjectMapper objectMapper, String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {
            });
        } catch (RuntimeException e) {
            throw new InvalidFieldException(FIELD, "The alt texts do not have a valid format.");
        }
    }

    /**
     * @param altTexts alternative texts in the same order as the uploaded files, may be {@code
     *     null}
     * @param index position of the file
     * @return the cleaned text for that file, or {@code null} if there is none
     */
    public static String at(List<String> altTexts, int index) {
        return altTexts != null && index < altTexts.size() ? clean(altTexts.get(index)) : null;
    }
}
