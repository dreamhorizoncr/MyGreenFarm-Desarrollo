package taller.multimedia.backend.service.translation;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import taller.multimedia.backend.model.translations.EntityTranslation;
import taller.multimedia.backend.repository.translation.EntityTranslationRepository;


@Service
@RequiredArgsConstructor
public class TranslationService {

    private final EntityTranslationRepository repository;
    private final GoogleCredentials googleCredentials;
    private final ObjectMapper objectMapper; // Spring ya expone este bean por defecto

    @Value("${google.cloud.project-id}")
    private String projectId;

    private final OkHttpClient httpClient = new OkHttpClient();

    public String getOrTranslate(String entityType, UUID entityId, String fieldName,
                                   String originalText, String targetLanguage) throws IOException {

        Optional<EntityTranslation> existing = repository
            .findByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(entityType, entityId, fieldName, targetLanguage);

        if (existing.isPresent()) {
            return existing.get().getTranslatedText();
        }

        String translatedText = callTranslateApi(originalText, targetLanguage);

        EntityTranslation translation = new EntityTranslation();
        translation.setEntityType(entityType);
        translation.setEntityId(entityId);
        translation.setFieldName(fieldName);
        translation.setLanguageCode(targetLanguage);
        translation.setTranslatedText(translatedText);
        repository.save(translation);

        return translatedText;
    }

    private String callTranslateApi(String text, String targetLanguage) throws IOException {
        googleCredentials.refreshIfExpired();
        String accessToken = googleCredentials.getAccessToken().getTokenValue();

        String url = "https://translation.googleapis.com/v3/projects/" + projectId + "/locations/global:translateText";

        Map<String, Object> body = Map.of(
            "contents", List.of(text),
            "targetLanguageCode", targetLanguage
        );
        String jsonBody = objectMapper.writeValueAsString(body);

        Request request = new Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer " + accessToken)
            .post(RequestBody.create(jsonBody, MediaType.parse("application/json")))
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Error de Google Translate API: " + response.code() + " - " + response.body().string());
            }
            JsonNode root = objectMapper.readTree(response.body().string());
            return root.path("translations").get(0).path("translatedText").asText();
        }
    }
}