package taller.multimedia.backend.service.spelling;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import taller.multimedia.backend.util.Sanitizer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class SpellingCorrectionService {

    private static final Logger log = LoggerFactory.getLogger(SpellingCorrectionService.class);

    private static final String PROMPT =
            "Eres un corrector ortográfico de textos en español de una guardería y granja educativa en Costa Rica. "
                    + "Recibirás un objeto JSON cuyos valores son textos. "
                    + "Corrige SOLO la ortografía: tildes, letras equivocadas, mayúscula al inicio de oración y "
                    + "signos de puntuación (incluidos ¿ y ¡). "
                    + "No cambies palabras por sinónimos, no reescribas frases, no agregues ni quites contenido, "
                    + "no traduzcas. Respeta tal cual los nombres propios, marcas, palabras en otros idiomas "
                    + "(inglés, francés), números, emojis y los saltos de línea. "
                    + "Si un texto ya está bien escrito, devuélvelo idéntico. "
                    + "Responde ÚNICAMENTE con un objeto JSON con las mismas claves.\n\nJSON:\n";

    private static final double MAX_LENGTH_CHANGE = 0.15;
    private static final int MIN_LENGTH_SLACK = 10;

    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    @Value("${gemini.base-url}")
    private String baseUrl;

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();

    public Map<String, String> correct(Map<String, String> texts) {
        Map<String, String> pending = new LinkedHashMap<>();
        texts.forEach((field, value) -> {
            if (value != null && !value.isBlank()) {
                pending.put(field, value);
            }
        });
        if (pending.isEmpty() || apiKey == null || apiKey.isBlank()) {
            return Map.of();
        }

        JsonNode corrected = callGemini(pending);
        if (corrected == null) {
            return Map.of();
        }

        Map<String, String> changes = new LinkedHashMap<>();
        pending.forEach((field, original) -> {
            String candidate = corrected.path(field).asString(null);
            if (candidate != null && !candidate.equals(original) && isSafeCorrection(original, candidate)) {
                changes.put(field, candidate);
            }
        });
        return changes;
    }

    private boolean isSafeCorrection(String original, String candidate) {
        if (candidate.isBlank() || Sanitizer.hasMaliciousContent(candidate)) {
            return false;
        }
        int allowedChange = Math.max(MIN_LENGTH_SLACK, (int) (original.length() * MAX_LENGTH_CHANGE));
        if (Math.abs(candidate.length() - original.length()) > allowedChange) {
            return false;
        }
        return lineCount(candidate) == lineCount(original);
    }

    private long lineCount(String text) {
        return text.replace("\r\n", "\n").chars().filter(c -> c == '\n').count();
    }

    private JsonNode callGemini(Map<String, String> texts) {
        try {
            String url = baseUrl + "/models/" + model + ":generateContent";
            String input = objectMapper.writeValueAsString(texts);
            int totalLength = texts.values().stream().mapToInt(String::length).sum();

            Map<String, Object> part = Map.of("text", PROMPT + input);
            Map<String, Object> generationConfig = Map.of(
                    "temperature", 0,
                    "responseMimeType", "application/json",
                    "maxOutputTokens", totalLength + 512);
            Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of("parts", List.of(part))),
                    "generationConfig", generationConfig);

            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("x-goog-api-key", apiKey)
                    .post(RequestBody.create(objectMapper.writeValueAsString(body), MediaType.parse("application/json")))
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    log.error("Error llamando a Gemini para corregir ortografía: status={}", response.code());
                    return null;
                }
                String responseBody = response.body() != null ? response.body().string() : null;
                if (responseBody == null || responseBody.isBlank()) {
                    return null;
                }

                String text = objectMapper.readTree(responseBody)
                        .path("candidates").path(0)
                        .path("content").path("parts").path(0)
                        .path("text").asString(null);
                if (text == null || text.isBlank()) {
                    log.error("Gemini no devolvió la corrección ortográfica");
                    return null;
                }
                JsonNode json = objectMapper.readTree(text);
                return json.isObject() ? json : null;
            }
        } catch (Exception e) {
            log.error("Error corrigiendo ortografía con Gemini: {}", e.getMessage(), e);
            return null;
        }
    }
}
