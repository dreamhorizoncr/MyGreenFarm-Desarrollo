package taller.multimedia.backend.service.translation;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import okhttp3.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.ArrayList;

import org.apache.commons.text.StringEscapeUtils;

import taller.multimedia.backend.model.translation.EntityTranslation;
import taller.multimedia.backend.repository.translation.EntityTranslationRepository;
import taller.multimedia.backend.util.HashUtils;
import taller.multimedia.backend.dto.translation.TranslationItem;

/**
 * Translates site content with Google Cloud Translation and caches each translation in the
 * database.
 *
 * <p>A cached translation is reused while the original text does not change, which is detected by
 * comparing its SHA-256 hash. Long content fields are translated paragraph by paragraph so their
 * line breaks are kept.
 */
@Service
@RequiredArgsConstructor
public class TranslationService {

    private static final String CONTENT_FIELD = "content";
    private static final String PARAGRAPH_SEPARATOR = "\n\n";

    private final EntityTranslationRepository repository;
    private final GoogleCredentials googleCredentials;
    private final ObjectMapper objectMapper;

    @Value("${google.cloud.project-id}")
    private String projectId;

    private final OkHttpClient httpClient = new OkHttpClient();

    /**
     * Returns the translation of one field, translating it only if it is not cached or the original
     * changed.
     *
     * @param entityType type of the translated entity, for example {@code announcement}
     * @param entityId entity ID
     * @param fieldName translated field; {@code content} is split into paragraphs
     * @param originalText text in Spanish
     * @param targetLanguage language code, for example {@code en}
     * @return the translated text
     * @throws IOException if Google Translation fails
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String getOrTranslate(String entityType, UUID entityId, String fieldName,
            String originalText, String targetLanguage) throws IOException {

        Optional<EntityTranslation> existing = repository
                .findFirstByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(entityType, entityId, fieldName,
                        targetLanguage);

        String sourceTextHash = HashUtils.sha256(originalText);

        if (existing.isPresent()
                && sourceTextHash.equals(existing.get().getSourceTextHash())) {
            return unescapeHtml(existing.get().getTranslatedText());
        }

        String translatedText = translateField(fieldName, originalText, targetLanguage);

        EntityTranslation translation = new EntityTranslation();
        translation.setEntityType(entityType);
        translation.setEntityId(entityId);
        translation.setFieldName(fieldName);
        translation.setLanguageCode(targetLanguage);
        translation.setTranslatedText(translatedText);
        translation.setSourceTextHash(sourceTextHash);
        repository.save(translation);

        return translatedText;
    }

    /**
     * Translates several fields of the same entity type at once, reusing the cached ones. Entities
     * with numeric IDs (such as clubs) are cached under a UUID derived from their type and ID.
     *
     * @param entityType type of the translated entities
     * @param items fields to translate
     * @param targetLanguage language code
     * @return translations by {@code entityId:fieldName}
     * @throws IOException if Google Translation fails
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Map<String, String> getOrTranslateBatch(String entityType, List<TranslationItem> items,
        String targetLanguage) throws IOException {

    List<EntityTranslation> existing = repository.findByEntityTypeAndLanguageCode(
            entityType,
            targetLanguage
    );

    Map<String, EntityTranslation> cache = existing.stream()
            .collect(Collectors.toMap(
                    translation -> key(translation.getEntityId(), translation.getFieldName()),
                    Function.identity(),
                    (first, duplicate) -> first));

    Map<String, String> result = new HashMap<>();
    List<TranslationItem> toTranslate = new ArrayList<>();

    for (TranslationItem item : items) {

        UUID translationEntityId = translationEntityId(entityType, item.entityId());
        String cacheKey = key(translationEntityId, item.fieldName());
        String responseKey = responseKey(item.entityId(), item.fieldName());
        String sourceTextHash = HashUtils.sha256(item.originalText());

        EntityTranslation cachedTranslation = cache.get(cacheKey);

        if (cachedTranslation != null
                && sourceTextHash.equals(cachedTranslation.getSourceTextHash())) {

                result.put(responseKey, unescapeHtml(cachedTranslation.getTranslatedText()));

        } else {
            toTranslate.add(item);
        }
    }

    if (!toTranslate.isEmpty()) {

        for (TranslationItem item : toTranslate) {

            String translated = translateField(item.fieldName(), item.originalText(), targetLanguage);

            UUID translationEntityId = translationEntityId(entityType, item.entityId());
            result.put(responseKey(item.entityId(), item.fieldName()), translated);

            EntityTranslation translation = repository
                    .findFirstByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(
                            entityType,
                            translationEntityId,
                            item.fieldName(),
                            targetLanguage
                    )
                    .orElseGet(EntityTranslation::new);

            translation.setEntityType(entityType);
            translation.setEntityId(translationEntityId);
            translation.setFieldName(item.fieldName());
            translation.setLanguageCode(targetLanguage);
            translation.setTranslatedText(translated);
            translation.setSourceTextHash(
                    HashUtils.sha256(item.originalText())
            );

            try {
                repository.save(translation);
            } catch (DataIntegrityViolationException e) {
                // Another concurrent request already inserted this row
            }
        }
    }

    return result;
}

    /**
     * Translates texts without caching them, for one-off texts such as the evaluation summaries
     * emailed to parents.
     *
     * @param texts texts to translate
     * @param targetLanguage language code
     * @param mimeType {@code text/plain} or {@code text/html}
     * @return the translations, in the same order
     * @throws IOException if Google Translation fails
     */
    public List<String> translateBatchWithoutSaving(List<String> texts, String targetLanguage,
            String mimeType) throws IOException {
        return callTranslateApiBatch(texts, null, targetLanguage, mimeType);
    }

    /**
     * @param fieldName translated field; {@code content} is translated paragraph by paragraph
     * @param text text to translate
     * @param targetLanguage language code
     * @return the translated text
     * @throws IOException if Google Translation fails
     */
    private String translateField(String fieldName, String text, String targetLanguage) throws IOException {
        if (CONTENT_FIELD.equals(fieldName)) {
            List<String> translatedParagraphs = callTranslateApiBatch(List.of(text.split(PARAGRAPH_SEPARATOR)), targetLanguage);
            return String.join(PARAGRAPH_SEPARATOR, translatedParagraphs);
        }
        return callTranslateApiBatch(List.of(text), targetLanguage).get(0);
    }

    private String unescapeHtml(String text) {
        return StringEscapeUtils.unescapeHtml4(text);
    }

    private String key(UUID entityId, String fieldName) {
        return entityId + ":" + fieldName;
    }

    /**
     * @param entityType type of the entity
     * @param entityId entity ID as text
     * @return the ID itself when it is a UUID, or a UUID derived from the type and ID when it is
     *     numeric
     * @throws IllegalArgumentException if the ID is neither
     */
    private UUID translationEntityId(String entityType, String entityId) {
        try {
            return UUID.fromString(entityId);
        } catch (IllegalArgumentException exception) {
            if (entityId.matches("\\d+")) {
                return UUID.nameUUIDFromBytes((entityType.toLowerCase() + ":" + entityId).getBytes(StandardCharsets.UTF_8));
            }
            throw exception;
        }
    }

    private String responseKey(String entityId, String fieldName) {
        return entityId + ":" + fieldName;
    }

    private List<String> callTranslateApiBatch(List<String> texts, String targetLanguage) throws IOException {
        return callTranslateApiBatch(texts, null, targetLanguage, null);
    }

    /**
     * @param texts texts to translate
     * @param sourceLanguage source language, or {@code null} to let Google detect it
     * @param targetLanguage language code
     * @param mimeType content type, or {@code null} for HTML
     * @return the translations, in the same order
     * @throws IOException if the call fails or returns a different number of translations
     */
    private List<String> callTranslateApiBatch(List<String> texts, String sourceLanguage,
            String targetLanguage, String mimeType) throws IOException {
        googleCredentials.refreshIfExpired();
        String accessToken = googleCredentials.getAccessToken().getTokenValue();

        String url = "https://translation.googleapis.com/v3/projects/" + projectId + "/locations/global:translateText";

        Map<String, Object> body = new HashMap<>();
        body.put("contents", texts);
        body.put("targetLanguageCode", targetLanguage);
        if (sourceLanguage != null && !sourceLanguage.isBlank()) {
            body.put("sourceLanguageCode", sourceLanguage);
        }
        if (mimeType != null && !mimeType.isBlank()) {
            body.put("mimeType", mimeType);
        }
        String jsonBody = objectMapper.writeValueAsString(body);

        Request request = new Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer " + accessToken)
                .post(RequestBody.create(jsonBody, MediaType.parse("application/json")))
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException(
                        "Google Translate API error: " + response.code() + " - " + response.body().string());
            }
            JsonNode root = objectMapper.readTree(response.body().string());
            List<String> results = new ArrayList<>();
            for (JsonNode node : root.path("translations")) {
                String translatedText = node.path("translatedText").asString();
                results.add(unescapeHtml(translatedText));
            }
            if (results.size() != texts.size()) {
                throw new IOException("Google Translate returned an unexpected number of translations.");
            }
            return results;
        }
    }
}
