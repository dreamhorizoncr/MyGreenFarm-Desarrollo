package taller.multimedia.backend.service.forum;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

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
    private static final String NAME_REJECTED_MESSAGE =
            "Ese nombre no cumple con las normas del foro. Elegí otro para continuar.";
    private static final String UNAVAILABLE_MESSAGE =
            "No se pudo verificar el contenido en este momento. Intenta de nuevo en unos segundos.";
    private static final String EMOJI_REJECTED_MESSAGE =
            "No se permiten emojis en el foro. Quítalos e intenta de nuevo.";

    // Detecta emojis sin depender de Gemini.
    private static final Pattern EMOJI_PATTERN = Pattern.compile(
            "[\\x{1F300}-\\x{1FAFF}\\x{2600}-\\x{27BF}\\x{1F1E6}-\\x{1F1FF}\\x{2B00}-\\x{2BFF}\\x{FE0F}\\x{200D}]");

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
                    + "spam, publicidad; contenido político o religioso ofensivo, proselitista o burlón; "
                    + "o que suplanta/parodia a una figura pública o religiosa real; "
                    + "o cualquier otro contenido inapropiado para un entorno escolar con niños. "
                    + "Esto incluye insultos y groserías coloquiales en español latinoamericano (por ejemplo, "
                    + "pero no limitado a: \"malparido\", \"hijueputa\"/\"hijueputas\", \"carepicha\"/\"carepichas\", "
                    + "\"mierda\", \"pendejo\", \"gonorrea\"), aunque estén mal escritas o disimuladas.\n"
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
                    + "violento, spam; contenido político o religioso ofensivo, proselitista o burlón; "
                    + "o que suplanta/parodia a una figura pública o religiosa real; "
                    + "o cualquier otro contenido inapropiado para un entorno escolar con niños. "
                    + "Esto incluye insultos y groserías coloquiales en español latinoamericano (por ejemplo, "
                    + "pero no limitado a: \"malparido\", \"hijueputa\"/\"hijueputas\", \"carepicha\"/\"carepichas\", "
                    + "\"mierda\", \"pendejo\", \"gonorrea\"), aunque estén mal escritas o disimuladas.\n"
                    + "- \"onTopic\" es false si el comentario no guarda ninguna relación razonable con el tema o "
                    + "el título del artículo (por ejemplo, habla de algo completamente distinto).\n"
                    + SPELLING_INSTRUCTION;

    private static final String NAME_PROMPT =
            "Eres un moderador de contenido para el foro de un centro educativo infantil "
                    + "(familias con niños de 0 a 12 años). Evalúa el siguiente nombre o alias que una persona "
                    + "eligió para publicar en el foro.\n\n"
                    + "Nombre a evaluar:\n\"%s\"\n\n"
                    + "Antes de responder, usa la búsqueda para comprobar si ese nombre completo corresponde a "
                    + "una persona real con un cargo público (presidente, diputado, alcalde, síndico, regidor, "
                    + "líder religioso, etc.), aunque sea una figura local o poco conocida a nivel nacional. "
                    + "No asumas que no es real solo porque no la reconoces de memoria.\n\n"
                    + "Responde ÚNICAMENTE con un JSON de una línea, sin texto adicional ni bloques de código, "
                    + "con este formato exacto:\n"
                    + "{\"appropriate\": true|false}\n\n"
                    + "\"appropriate\" es false si el nombre contiene lenguaje vulgar, sexual u ofensivo, un doble "
                    + "sentido o juego de palabras de mal gusto, una burla o referencia a política o religión, "
                    + "o suplanta a una figura pública o religiosa real (nacional o local). Un nombre común y corriente (real, "
                    + "inventado o un apodo normal) es \"appropriate\": true.";

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
        rejectIfEmoji("content", content);
        JsonNode result = callGemini("content", APPROPRIATE_PROMPT.formatted(content), false);
        boolean appropriate = result != null && result.path("appropriate").asBoolean(false);

        if (!appropriate) {
            throw new InvalidFieldException("content", REJECTED_MESSAGE);
        }

        return correctedContent(result, content);
    }

    // Used for replies to blog articles: content has to be appropriate AND relevant
    // to the article it responds to. Returns the spelling-corrected content.
    public String assertCommentRelevant(String articleTopic, String articleTitle, String commentContent) {
        rejectIfEmoji("content", commentContent);
        JsonNode result = callGemini("content", COMMENT_PROMPT.formatted(articleTopic, articleTitle, commentContent), false);
        boolean appropriate = result != null && result.path("appropriate").asBoolean(false);
        boolean onTopic = result != null && result.path("onTopic").asBoolean(false);

        if (!appropriate || !onTopic) {
            throw new InvalidFieldException("content", REJECTED_MESSAGE);
        }

        return correctedContent(result, commentContent);
    }

    // Used for the display name/alias people choose when posting: blocks vulgar, political,
    // religious or mocking names (e.g. puns impersonating public figures), independent of content.
    public void assertAppropriateName(String fieldName, String name) {
        rejectIfEmoji(fieldName, name);
        JsonNode result = callGemini(fieldName, NAME_PROMPT.formatted(name), true);
        boolean appropriate = result != null && result.path("appropriate").asBoolean(false);

        if (!appropriate) {
            throw new InvalidFieldException(fieldName, NAME_REJECTED_MESSAGE);
        }
    }

    private void rejectIfEmoji(String fieldName, String text) {
        if (text != null && EMOJI_PATTERN.matcher(text).find()) {
            throw new InvalidFieldException(fieldName, EMOJI_REJECTED_MESSAGE);
        }
    }

    // Falls back to the original content if Gemini didn't return a usable correction,
    // so a missing/blank field never erases what the user wrote.
    private String correctedContent(JsonNode result, String original) {
        String corrected = result.path("correctedContent").asString();
        return corrected == null || corrected.isBlank() ? original : corrected;
    }

    // withSearchGrounding le da a Gemini la herramienta de Búsqueda de Google para que
    // verifique si el nombre corresponde a una persona real (política, religiosa, etc.)
    // en vez de depender solo de lo que recuerde de su entrenamiento, que no cubre bien
    // a figuras poco conocidas (ej. alcaldes o síndicos locales).
    private JsonNode callGemini(String fieldName, String prompt, boolean withSearchGrounding) {
        try {
            String url = baseUrl + "/models/" + model + ":generateContent";

            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(part));
            Map<String, Object> generationConfig = Map.of(
                    "temperature", 0.0,
                    "maxOutputTokens", withSearchGrounding ? 300 : 50);
            Map<String, Object> body = new HashMap<>(Map.of(
                    "contents", List.of(content),
                    "generationConfig", generationConfig));
            if (withSearchGrounding) {
                body.put("tools", List.of(Map.of("google_search", Map.of())));
            }

            String jsonBody = objectMapper.writeValueAsString(body);

            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("x-goog-api-key", apiKey)
                    .post(RequestBody.create(jsonBody, MediaType.parse("application/json")))
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    log.error("Error llamando a Gemini API para moderación: status={}", response.code());
                    throw new InvalidFieldException(fieldName, UNAVAILABLE_MESSAGE);
                }

                String responseBody = response.body() != null ? response.body().string() : null;
                if (responseBody == null || responseBody.isBlank()) {
                    log.error("Gemini API devolvió una respuesta vacía para moderación");
                    throw new InvalidFieldException(fieldName, UNAVAILABLE_MESSAGE);
                }

                JsonNode root = objectMapper.readTree(responseBody);

                // Gemini's own safety filters blocked the prompt or the response outright:
                // treat that as a rejection, since it is itself evidence the content is unsafe.
                if (root.path("candidates").isEmpty()) {
                    log.warn("Gemini bloqueó el contenido a moderar: {}", root.path("promptFeedback"));
                    throw new InvalidFieldException(fieldName, REJECTED_MESSAGE);
                }

                String text = root
                        .path("candidates").path(0)
                        .path("content").path("parts").path(0)
                        .path("text").asString();

                if (text == null || text.isBlank()) {
                    log.error("Gemini API no devolvió texto en la respuesta de moderación");
                    throw new InvalidFieldException(fieldName, UNAVAILABLE_MESSAGE);
                }

                return objectMapper.readTree(extractJson(text));
            }
        } catch (InvalidFieldException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error moderando contenido con Gemini API: {}", e.getMessage());
            // Fail closed: if we can't verify the content, we don't publish it.
            throw new InvalidFieldException(fieldName, UNAVAILABLE_MESSAGE);
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
