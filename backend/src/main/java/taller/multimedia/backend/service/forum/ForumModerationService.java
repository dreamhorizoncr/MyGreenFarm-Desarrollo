package taller.multimedia.backend.service.forum;

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
import taller.multimedia.backend.exception.InvalidFieldException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

// Synchronous, Gemini-backed moderation gate for the parts of the forum that
// regular families can write to directly: the community wall and replies.
// Blog articles are written by staff (teachers/admins) and are not moderated.
@Service
@RequiredArgsConstructor
public class ForumModerationService {

    private static final Logger log = LoggerFactory.getLogger(ForumModerationService.class);

    private static final String REJECTED_MESSAGE =
            "No pudimos publicar el contenido porque no cumple con las normas del foro.";
    private static final String UNAVAILABLE_MESSAGE =
            "No se pudo verificar el contenido en este momento. Intenta de nuevo en unos segundos.";

    private static final String SPELLING_INSTRUCTION =
            "- \"correctedContent\" es el mismo mensaje con la ortografía, tildes y puntuación corregidas. "
                    + "No cambies el significado, el tono, las palabras, el idioma ni el estilo (informal está bien); "
                    + "corrige únicamente errores ortográficos evidentes. Si no hay errores, devuelve el texto igual.";

    private static final String APPROPRIATE_PROMPT =
            "Eres un moderador de contenido para el muro comunitario de un centro educativo infantil "
                    + "(familias con niños de 0 a 12 años). Evalúa el siguiente mensaje publicado por una familia.\n\n"
                    + "Mensaje a evaluar:\n\"%s\"\n\n"
                    + "Responde ÚNICAMENTE con un JSON de una línea, sin texto adicional ni bloques de código, "
                    + "con este formato exacto:\n"
                    + "{\"appropriate\": true|false, \"correctedContent\": \"...\"}\n\n"
                    + "\"appropriate\" es false si el mensaje contiene lenguaje vulgar, ofensivo, sexual, violento, "
                    + "spam, publicidad o cualquier contenido inapropiado para un entorno escolar con niños.\n"
                    + SPELLING_INSTRUCTION;

    private static final String COMMENT_PROMPT =
            "Eres un moderador de contenido para el foro de un centro educativo infantil "
                    + "(familias con niños de 0 a 12 años). Evalúa el siguiente comentario que una familia escribió "
                    + "en respuesta a un artículo del blog publicado por el personal del centro.\n\n"
                    + "Tema del artículo: \"%s\"\n"
                    + "Título del artículo: \"%s\"\n"
                    + "Comentario a evaluar:\n\"%s\"\n\n"
                    + "Responde ÚNICAMENTE con un JSON de una línea, sin texto adicional ni bloques de código, "
                    + "con este formato exacto:\n"
                    + "{\"appropriate\": true|false, \"onTopic\": true|false, \"correctedContent\": \"...\"}\n\n"
                    + "- \"appropriate\" es false si el comentario contiene lenguaje vulgar, ofensivo, sexual, "
                    + "violento, spam o cualquier contenido inapropiado para un entorno escolar con niños.\n"
                    + "- \"onTopic\" es false si el comentario no guarda ninguna relación razonable con el tema o "
                    + "el título del artículo (por ejemplo, habla de algo completamente distinto).\n"
                    + SPELLING_INSTRUCTION;

    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    @Value("${gemini.base-url}")
    private String baseUrl;

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build();

    // Used for the community wall and its replies: content just has to be appropriate.
    // Returns the content with spelling/accents/punctuation corrected by Gemini.
    public String assertAppropriate(String content) {
        JsonNode result = callGemini(APPROPRIATE_PROMPT.formatted(content));
        boolean appropriate = result != null && result.path("appropriate").asBoolean(false);

        if (!appropriate) {
            throw new InvalidFieldException("content", REJECTED_MESSAGE);
        }

        return correctedContent(result, content);
    }

    // Used for replies to blog articles: content has to be appropriate AND relevant
    // to the article it responds to. Returns the spelling-corrected content.
    public String assertCommentRelevant(String articleTopic, String articleTitle, String commentContent) {
        JsonNode result = callGemini(COMMENT_PROMPT.formatted(articleTopic, articleTitle, commentContent));
        boolean appropriate = result != null && result.path("appropriate").asBoolean(false);
        boolean onTopic = result != null && result.path("onTopic").asBoolean(false);

        if (!appropriate || !onTopic) {
            throw new InvalidFieldException("content", REJECTED_MESSAGE);
        }

        return correctedContent(result, commentContent);
    }

    // Falls back to the original content if Gemini didn't return a usable correction,
    // so a missing/blank field never erases what the user wrote.
    private String correctedContent(JsonNode result, String original) {
        String corrected = result.path("correctedContent").asString();
        return corrected == null || corrected.isBlank() ? original : corrected;
    }

    private JsonNode callGemini(String prompt) {
        try {
            String url = baseUrl + "/models/" + model + ":generateContent";

            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(part));
            Map<String, Object> generationConfig = Map.of(
                    "temperature", 0.0,
                    "maxOutputTokens", 50);
            Map<String, Object> body = Map.of(
                    "contents", List.of(content),
                    "generationConfig", generationConfig);

            String jsonBody = objectMapper.writeValueAsString(body);

            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("x-goog-api-key", apiKey)
                    .post(RequestBody.create(jsonBody, MediaType.parse("application/json")))
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    log.error("Error llamando a Gemini API para moderación: status={}", response.code());
                    throw new InvalidFieldException("content", UNAVAILABLE_MESSAGE);
                }

                String responseBody = response.body() != null ? response.body().string() : null;
                if (responseBody == null || responseBody.isBlank()) {
                    log.error("Gemini API devolvió una respuesta vacía para moderación");
                    throw new InvalidFieldException("content", UNAVAILABLE_MESSAGE);
                }

                JsonNode root = objectMapper.readTree(responseBody);

                // Gemini's own safety filters blocked the prompt or the response outright:
                // treat that as a rejection, since it is itself evidence the content is unsafe.
                if (root.path("candidates").isEmpty()) {
                    log.warn("Gemini bloqueó el contenido a moderar: {}", root.path("promptFeedback"));
                    throw new InvalidFieldException("content", REJECTED_MESSAGE);
                }

                String text = root
                        .path("candidates").path(0)
                        .path("content").path("parts").path(0)
                        .path("text").asString();

                if (text == null || text.isBlank()) {
                    log.error("Gemini API no devolvió texto en la respuesta de moderación");
                    throw new InvalidFieldException("content", UNAVAILABLE_MESSAGE);
                }

                return objectMapper.readTree(extractJson(text));
            }
        } catch (InvalidFieldException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error moderando contenido con Gemini API: {}", e.getMessage());
            // Fail closed: if we can't verify the content, we don't publish it.
            throw new InvalidFieldException("content", UNAVAILABLE_MESSAGE);
        }
    }

    // Gemini sometimes wraps its JSON answer in a ```json ... ``` code fence despite
    // being told not to; strip that before parsing.
    private String extractJson(String text) {
        String trimmed = text.trim();
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        return start >= 0 && end > start ? trimmed.substring(start, end + 1) : trimmed;
    }
}
