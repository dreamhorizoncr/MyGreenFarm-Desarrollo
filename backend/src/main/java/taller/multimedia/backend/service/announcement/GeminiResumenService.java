package taller.multimedia.backend.service.announcement;

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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class GeminiResumenService {

    private static final Logger log = LoggerFactory.getLogger(GeminiResumenService.class);

    private static final String PROMPT_BASE =
            "Resume el siguiente texto en 1 o 2 oraciones breves (máximo 45 palabras en total), "
                    + "en español, con tono claro y cálido. "
                    + "Usa solo la información del texto, sin inventar datos, y resume literalmente lo que dice "
                    + "el texto sin importar el tema que trate. "
                    + "No evalúes, juzgues ni comentes si el texto corresponde a un contexto de guardería, "
                    + "educación infantil o cualquier otro tema esperado: tu única tarea es resumir el contenido tal "
                    + "cual, como lo harías con cualquier texto. "
                    + "Responde ÚNICAMENTE con el resumen en texto plano: sin notas, aclaraciones, advertencias "
                    + "ni formato Markdown.\n\nTexto:\n";

    private static final String PROMPT_EVALUATION = 
        "Eres un pedagogo experto de una guardería. Tu tarea es analizar el historial completo "
        + "de evaluaciones del semestre del niño/a %s y sintetizar su evolución general.\n\n"
        + "REGLAS RIGUROSAS:\n"
        + "1. Redacta un mensaje cálido, motivador y profesional dirigido a los padres.\n"
        + "2. NO listes fecha por fecha. Resume los avances clave en comunicación, lenguaje, lectura y desarrollo motor.\n"
        + "3. MANTÉN EL TEXTO BREVE: Máximo 120 palabras en total.\n"
        + "4. Finaliza el mensaje despidiéndote explícitamente a nombre del equipo de The Green Farm.\n\n"
        + "Historial de evaluaciones del semestre:\n%s";
        
    private static final String PROMPT_ARTICULO_FORO =
            "Resume el siguiente texto en una sola oración breve (máximo 30 palabras), "
                    + "en español, con tono claro y cálido. "
                    + "Usa solo la información del texto, sin inventar datos, y resume literalmente lo que dice "
                    + "el texto sin importar el tema que trate. "
                    + "No evalúes, juzgues ni comentes si el texto corresponde a un contexto de guardería, "
                    + "educación infantil o cualquier otro tema esperado: tu única tarea es resumir el contenido tal "
                    + "cual, como lo harías con cualquier texto. "
                    + "Responde ÚNICAMENTE con el resumen en texto plano: sin notas, aclaraciones, advertencias "
                    + "ni formato Markdown.\n\nTexto:\n";

    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    @Value("${gemini.base-url}")
    private String baseUrl;

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .build();

    public String generateSummary(String content) {
        return callGemini(PROMPT_BASE + content);
    }

    public String generateSemiannualEvaluationSummary(String childName, String evaluationHistory) {
        String prompt = String.format(PROMPT_EVALUATION, childName, evaluationHistory);
        return callGemini(prompt);
    }

    public String generateArticleSummary(String content) {
        return callGemini(PROMPT_ARTICULO_FORO + content);
    }

    private String callGemini(String prompt) {
        try {
            String url = baseUrl + "/models/" + model + ":generateContent";

            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(part));
            Map<String, Object> generationConfig = Map.of(
                    "temperature", 0.3,
                    "maxOutputTokens", 200);
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
                    log.error("Error llamando a Gemini API: status={}", response.code());
                    return null;
                }

                String responseBody = response.body() != null ? response.body().string() : null;
                if (responseBody == null || responseBody.isBlank()) {
                    log.error("Gemini API devolvió una respuesta vacía");
                    return null;
                }

                JsonNode root = objectMapper.readTree(responseBody);
                String text = root
                        .path("candidates").path(0)
                        .path("content").path("parts").path(0)
                        .path("text").asString();

                if (text == null || text.isBlank()) {
                    log.error("Gemini API no devolvió texto en la respuesta");
                    return null;
                }

                return stripMetaNotes(text.trim());
            }
        } catch (Exception e) {
            log.error("Error generando resumen con Gemini API: {}", e.getMessage(), e);
            return null;
        }
    }

    // Gemini a veces antepone una nota/aclaración entre asteriscos (p. ej. cuando el
    // contenido no encaja con el tema esperado) a pesar de que el prompt lo prohíbe.
    // La quitamos como segunda capa de defensa para que nunca llegue al usuario.
    private String stripMetaNotes(String text) {
        String withoutLeadingNote = text.replaceFirst("^\\*[^*]+\\*\\s*", "");
        return withoutLeadingNote.isBlank() ? text : withoutLeadingNote.trim();
    }
}
