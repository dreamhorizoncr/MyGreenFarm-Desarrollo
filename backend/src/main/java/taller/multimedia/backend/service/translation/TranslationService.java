package taller.multimedia.backend.service.translation;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import okhttp3.*;

// import org.hibernate.mapping.Array;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.ArrayList;

import org.apache.commons.text.StringEscapeUtils;

import taller.multimedia.backend.model.translations.EntityTranslation;
import taller.multimedia.backend.repository.translation.EntityTranslationRepository;
import taller.multimedia.backend.utils.HashUtils;
import taller.multimedia.backend.dto.translation.TranslationItem;

@Service
@RequiredArgsConstructor
public class TranslationService {

    private final EntityTranslationRepository repository;
    private final GoogleCredentials googleCredentials;
    private final ObjectMapper objectMapper;

    @Value("${google.cloud.project-id}")
    private String projectId;

    private final OkHttpClient httpClient = new OkHttpClient();

    public String getOrTranslate(String entityType, UUID entityId, String fieldName,
            String originalText, String targetLanguage) throws IOException {

        Optional<EntityTranslation> existing = repository
                .findByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(entityType, entityId, fieldName,
                        targetLanguage);

        String sourceTextHash = HashUtils.sha256(originalText);

        if (existing.isPresent()
                && sourceTextHash.equals(existing.get().getSourceTextHash())) {
            return unescapeHtml(existing.get().getTranslatedText());
        }

        String translatedText;

        if("content".equals(fieldName)){
            List<String> paragraphs = List.of(originalText.split("\n\n"));

            List<String> translatedParagraphs = callTranslateApiBatch(
                paragraphs,
                targetLanguage
            );

            translatedText = String.join("\n\n", translatedParagraphs);

        }else{

            List<String> translated = callTranslateApiBatch(
            List.of(originalText),
            targetLanguage
            );

            translatedText = translated.get(0);

        }

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

    public Map<String, String> getOrTranslateBatch(String entityType, List<TranslationItem> items,
        String targetLanguage) throws IOException {

    List<EntityTranslation> existing = repository.findByEntityTypeAndLanguageCode(
            entityType,
            targetLanguage
    );

    Map<String, EntityTranslation> cache = existing.stream()
            .collect(Collectors.toMap(
                    e -> key(e.getEntityId(), e.getFieldName()),
                    e -> e,
                    (a, b) -> a));

    Map<String, String> result = new HashMap<>();
    List<TranslationItem> toTranslate = new ArrayList<>();

    for (TranslationItem item : items) {

        String k = key(item.entityId(), item.fieldName());
        String sourceTextHash = HashUtils.sha256(item.originalText());

        EntityTranslation cachedTranslation = cache.get(k);

        if (cachedTranslation != null
                && sourceTextHash.equals(cachedTranslation.getSourceTextHash())) {

            result.put(
                    k,
                    unescapeHtml(cachedTranslation.getTranslatedText())
            );

        } else {
            toTranslate.add(item);
        }
    }

    if (!toTranslate.isEmpty()) {

        for (TranslationItem item : toTranslate) {

            String translated;

            if ("content".equals(item.fieldName())) {

                List<String> paragraphs = List.of(
                        item.originalText().split("\n\n")
                );

                List<String> translatedParagraphs = callTranslateApiBatch(
                        paragraphs,
                        targetLanguage
                );

                translated = String.join("\n\n", translatedParagraphs);

            } else {

                List<String> translatedTexts = callTranslateApiBatch(
                        List.of(item.originalText()),
                        targetLanguage
                );

                translated = translatedTexts.get(0);
            }

            String k = key(item.entityId(), item.fieldName());

            result.put(k, translated);

            // Upsert: busca si ya existe justo antes de guardar
            EntityTranslation translation = repository
                    .findByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(
                            entityType,
                            item.entityId(),
                            item.fieldName(),
                            targetLanguage
                    )
                    .orElseGet(EntityTranslation::new);

            translation.setEntityType(entityType);
            translation.setEntityId(item.entityId());
            translation.setFieldName(item.fieldName());
            translation.setLanguageCode(targetLanguage);
            translation.setTranslatedText(translated);
            translation.setSourceTextHash(
                    HashUtils.sha256(item.originalText())
            );

            try {
                repository.save(translation);
            } catch (DataIntegrityViolationException e) {
                // Otra petición concurrente ya insertó este registro
            }
        }
    }

    return result;
}

    public List<String> translateBatchWithoutSaving(List<String> texts, String targetLanguage,
            String mimeType) throws IOException {
        return callTranslateApiBatch(texts, null, targetLanguage, mimeType);
    }

    private String unescapeHtml(String text) {
        return StringEscapeUtils.unescapeHtml4(text);
    }

    private String key(UUID entityId, String fieldName) {
        return entityId + ":" + fieldName;
    }

    private List<String> callTranslateApiBatch(List<String> texts, String targetLanguage) throws IOException {
        return callTranslateApiBatch(texts, null, targetLanguage, null);
    }

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
                        "Error de Google Translate API: " + response.code() + " - " + response.body().string());
            }
            JsonNode root = objectMapper.readTree(response.body().string());
            List<String> results = new ArrayList<>();
            for (JsonNode node : root.path("translations")) {
                String translatedText = node.path("translatedText").asString();
                results.add(unescapeHtml(translatedText));
            }
            if (results.size() != texts.size()) {
                throw new IOException("Google Translate devolvió una cantidad inesperada de traducciones.");
            }
            return results;
        }
    }
}
