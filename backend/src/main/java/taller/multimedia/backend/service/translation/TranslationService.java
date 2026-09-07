package taller.multimedia.backend.service.translation;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import okhttp3.*;

// import org.hibernate.mapping.Array;
import org.springframework.beans.factory.annotation.Value;
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

        if (existing.isPresent()) {
            return unescapeHtml(existing.get().getTranslatedText());
        }

        List<String> translated = callTranslateApiBatch(List.of(originalText), targetLanguage);
        String translatedText = translated.get(0);

        EntityTranslation translation = new EntityTranslation();
        translation.setEntityType(entityType);
        translation.setEntityId(entityId);
        translation.setFieldName(fieldName);
        translation.setLanguageCode(targetLanguage);
        translation.setTranslatedText(translatedText);
        repository.save(translation);

        return translatedText;
    }

    public Map<String, String> getOrTranslateBatch(String entityType, List<TranslationItem> items,
            String targetLanguage) throws IOException {
        List<EntityTranslation> existing = repository.findByEntityTypeAndLanguageCode(entityType, targetLanguage);
        Map<String, String> cache = existing.stream()
                .collect(Collectors.toMap(
                        e -> key(e.getEntityId(), e.getFieldName()),
                        e -> unescapeHtml(e.getTranslatedText())));

        Map<String, String> result = new HashMap<>();
        List<TranslationItem> toTranslate = new ArrayList<>();

        for (TranslationItem item : items) {
            String k = key(item.entityId(), item.fieldName());
            if (cache.containsKey(k)) {
                result.put(k, cache.get(k));
            } else {
                toTranslate.add(item);
            }
        }

        if (!toTranslate.isEmpty()) {
            List<String> translatedTexts = callTranslateApiBatch(
                    toTranslate.stream().map(TranslationItem::originalText).toList(),
                    targetLanguage);

            List<EntityTranslation> toSave = new ArrayList<>();
            for (int i = 0; i < toTranslate.size(); i++) {
                TranslationItem item = toTranslate.get(i);
                String translated = translatedTexts.get(i);

                String k = key(item.entityId(), item.fieldName());
                result.put(k, translated);

                EntityTranslation translation = new EntityTranslation();
                translation.setEntityType(entityType);
                translation.setEntityId(item.entityId());
                translation.setFieldName(item.fieldName());
                translation.setLanguageCode(targetLanguage);
                translation.setTranslatedText(translated);
                toSave.add(translation);
            }
            repository.saveAll(toSave);
        }

        return result;
    }

    private String unescapeHtml(String text) {
        return StringEscapeUtils.unescapeHtml4(text);
    }

    private String key(UUID entityId, String fieldName) {
        return entityId + ":" + fieldName;
    }

    private List<String> callTranslateApiBatch(List<String> texts, String targetLanguage) throws IOException {
        googleCredentials.refreshIfExpired();
        String accessToken = googleCredentials.getAccessToken().getTokenValue();

        String url = "https://translation.googleapis.com/v3/projects/" + projectId + "/locations/global:translateText";

        Map<String, Object> body = Map.of(
                "contents", texts,
                "targetLanguageCode", targetLanguage);
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
            return results;
        }
    }
}

// Optional<EntityTranslation> existing = repository
// .findByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(entityType, entityId,
// fieldName, targetLanguage);

// if (existing.isPresent()) {
// return existing.get().getTranslatedText();
// }

// String translatedText = callTranslateApi(originalText, targetLanguage);

// EntityTranslation translation = new EntityTranslation();
// translation.setEntityType(entityType);
// translation.setEntityId(entityId);
// translation.setFieldName(fieldName);
// translation.setLanguageCode(targetLanguage);
// translation.setTranslatedText(translatedText);
// repository.save(translation);

// return translatedText;
// }

// private String callTranslateApi(String text, String targetLanguage) throws
// IOException {
// googleCredentials.refreshIfExpired();
// String accessToken = googleCredentials.getAccessToken().getTokenValue();

// String url = "https://translation.googleapis.com/v3/projects/" + projectId +
// "/locations/global:translateText";

// Map<String, Object> body = Map.of(
// "contents", List.of(text),
// "targetLanguageCode", targetLanguage
// );
// String jsonBody = objectMapper.writeValueAsString(body);

// Request request = new Request.Builder()
// .url(url)
// .addHeader("Authorization", "Bearer " + accessToken)
// .post(RequestBody.create(jsonBody, MediaType.parse("application/json")))
// .build();

// try (Response response = httpClient.newCall(request).execute()) {
// if (!response.isSuccessful()) {
// throw new IOException("Error de Google Translate API: " + response.code() + "
// - " + response.body().string());
// }
// JsonNode root = objectMapper.readTree(response.body().string());
// return root.path("translations").get(0).path("translatedText").asText();
// }
// }
// }
