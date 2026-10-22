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

    private static final Pattern EMOJI_PATTERN = Pattern.compile(
            "[\\x{1F300}-\\x{1FAFF}\\x{2600}-\\x{27BF}\\x{1F1E6}-\\x{1F1FF}\\x{2B00}-\\x{2BFF}\\x{FE0F}\\x{200D}]");

    private static final String SPELLING_INSTRUCTION =
            "- \"correctedContent\" es el mismo mensaje con la ortografía, tildes y puntuación corregidas. "
                    + "No cambies el significado, el tono, las palabras, el idioma ni el estilo (informal está bien); "
                    + "corrige únicamente errores ortográficos evidentes. Si no hay errores, devuelve el texto igual.";

    private static final String CONTEXT =
            "Eres moderador del foro de un centro educativo infantil en Costa Rica "
                    + "(familias con niños de 0 a 12 años). ";

    private static final String PROFANITY_RULES =
            "Rechaza groserías, insultos o lenguaje sexual en español o inglés, aunque estén mal escritos, "
                    + "abreviados o disimulados con números, símbolos o espacios. Ejemplos: Costa Rica: malparido, "
                    + "hijueputa, hp, carepicha, picha, playo, zorra, puta, verga, culo, mierda, pendejo, huevón; "
                    + "México: chingar, pinche, culero, joto, alv; Colombia: gonorrea, carechimba, pirobo; "
                    + "Argentina: boludo, pelotudo, forro, conchudo; Chile: weón, culiao, ctm; Venezuela: coño, "
                    + "mamagüevo, mmg; Centroamérica: cerote; España: gilipollas, joder; inglés: fuck, shit, bitch, "
                    + "asshole, dick, pussy, wtf, insultos raciales u homofóbicos. Permite el habla coloquial que no "
                    + "es grosera: mae, maje, güey, pura vida, tuanis, diay, brete, chunche, güila. "
                    + "Rechaza también contenido sexual, violento, discriminatorio, acoso, spam, publicidad o datos "
                    + "personales de terceros. ";

    private static final String APPROPRIATE_PROMPT =
            CONTEXT + "Evalúa esta publicación del muro de la comunidad.\n\n"
                    + "Publicación:\n\"%s\"\n\n"
                    + "Reglas: " + PROFANITY_RULES
                    + "No se permite hablar de política (partidos, candidatos, gobiernos) ni hacer proselitismo o "
                    + "burlas religiosas. Sí se permiten cortesías como \"Dios los bendiga\" o \"Feliz Navidad\".\n\n"
                    + "Responde ÚNICAMENTE con un JSON de una línea, sin texto adicional ni bloques de código:\n"
                    + "{\"appropriate\": true|false, \"correctedContent\": \"...\"}\n"
                    + "- \"appropriate\" es false si incumple alguna regla.\n"
                    + SPELLING_INSTRUCTION;

    private static final String COMMENT_PROMPT =
            CONTEXT + "Evalúa este comentario a un artículo del blog del centro.\n\n"
                    + "Tema del artículo: \"%s\"\n"
                    + "Título del artículo: \"%s\"\n"
                    + "Comentario:\n\"%s\"\n\n"
                    + "Reglas: " + PROFANITY_RULES
                    + "Solo se permite mencionar figuras políticas o religiosas, o hablar de política o religión, si "
                    + "el artículo trata de ese tema y el comentario es respetuoso; si no, recházalo. Nunca se "
                    + "permiten burlas, insultos ni propaganda política o religiosa. Sí se permiten cortesías como "
                    + "\"Dios los bendiga\".\n\n"
                    + "Responde ÚNICAMENTE con un JSON de una línea, sin texto adicional ni bloques de código:\n"
                    + "{\"appropriate\": true|false, \"onTopic\": true|false, \"correctedContent\": \"...\"}\n"
                    + "- \"appropriate\" es false si incumple alguna regla.\n"
                    + "- \"onTopic\" es false si el comentario no tiene ninguna relación razonable con el tema o el "
                    + "título del artículo.\n"
                    + SPELLING_INSTRUCTION;

    private static final String NAME_PROMPT =
            CONTEXT + "Evalúa este nombre o alias con el que alguien firma en el foro.\n\n"
                    + "Nombre:\n\"%s\"\n\n"
                    + "Rechaza el nombre si:\n"
                    + "- Contiene groserías o lenguaje sexual u ofensivo, aunque esté disimulado.\n"
                    + "- Tiene doble sentido: parece un nombre y apellido normales, pero leído en voz alta o juntando "
                    + "sus partes forma una frase o palabra sexual, vulgar, de burla o que alude a abuso de menores, "
                    + "en español o en inglés (los típicos nombres falsos de broma).\n"
                    + "- Suplanta a un presidente o expresidente de cualquier país, a otro político (diputado, alcalde, "
                    + "ministro, aunque sea local), a una figura religiosa (Dios, Jesucristo, la Virgen, el Papa, "
                    + "Mahoma, Buda, Satanás) o a un personaje criminal (Hitler, Pablo Escobar).\n"
                    + "- Suena igual o casi igual a una de esas figuras o la imita con letras cambiadas, por ejemplo: "
                    + "Donald Prompt, Donal Trum, Obamna, Nayib Bukelele, Jesu Cristo.\n"
                    + "Si no sabes si un nombre completo corresponde a un político real, usa la búsqueda para "
                    + "comprobarlo. Un nombre común es válido aunque coincida con un nombre religioso (Jesús "
                    + "Rodríguez, María José Solano) y también lo son apodos normales (Mamá de Sofi, Familia Rojas).\n\n"
                    + "Responde ÚNICAMENTE con un JSON de una línea, sin texto adicional ni bloques de código:\n"
                    + "{\"appropriate\": true|false}";

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

    public String assertAppropriate(String content) {
        rejectIfEmoji("content", content);
        JsonNode result = callGemini("content", APPROPRIATE_PROMPT.formatted(content), false);
        boolean appropriate = result != null && result.path("appropriate").asBoolean(false);

        if (!appropriate) {
            throw new InvalidFieldException("content", REJECTED_MESSAGE);
        }

        return correctedContent(result, content);
    }

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

    private String correctedContent(JsonNode result, String original) {
        String corrected = result.path("correctedContent").asString();
        return corrected == null || corrected.isBlank() ? original : corrected;
    }

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
                if (response.code() == 429 && withSearchGrounding) {
                    log.warn("Gemini rechazó la búsqueda de Google por cuota (429); se modera sin búsqueda");
                    return callGemini(fieldName, prompt, false);
                }
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
            throw new InvalidFieldException(fieldName, UNAVAILABLE_MESSAGE);
        }
    }

    private String extractJson(String text) {
        String trimmed = text.trim();
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        return start >= 0 && end > start ? trimmed.substring(start, end + 1) : trimmed;
    }
}
