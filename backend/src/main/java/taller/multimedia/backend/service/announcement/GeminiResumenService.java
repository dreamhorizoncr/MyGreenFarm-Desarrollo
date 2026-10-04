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
            "Resume la siguiente noticia de una guardería en 1 o 2 oraciones breves (máximo 45 palabras en total), "
                    + "en español, con tono claro y cálido. "
                    + "Usa solo la información del texto, sin inventar datos.\n\nNoticia:\n";

    private static final String PROMPT_EVALUATION = 
        "Eres un pedagogo experto de una guardería. Genera un resumen semestral de progreso, "
        + "cálido, motivador y profesional en español (máximo 120 palabras), "
        + "dirigido a los padres del niño/a %s. "
        + "Finaliza el mensaje despidiéndote explícitamente a nombre del equipo de The Green Farm. "
        + "A continuación tienes las evaluaciones registradas en el último semestre en las áreas de "
        + "comunicación, lenguaje, lectura, desarrollo motor y observaciones del docente:\n\n%s";

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

    public String generarResumen(String contenido) {
        String prompt = PROMPT_BASE + contenido;
        return callGeminiApi(prompt, 200, 0.3);
    }

    public String generateSemiannualEvaluationSummary(String childName, String historialEvaluaciones) {
        String prompt = String.format(PROMPT_EVALUATION, childName, historialEvaluaciones);
        return callGeminiApi(prompt, 350, 0.4);
    }

    private String callGeminiApi(String prompt, int maxOutputTokens, double temperature) {
        try {
            String url = baseUrl + "/models/" + model + ":generateContent";

            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(part));
            Map<String, Object> generationConfig = Map.of(
                    "temperature", temperature,
                    "maxOutputTokens", maxOutputTokens);
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

                return text.trim();
            }
        } catch (Exception e) {
            log.error("Error generando resumen con Gemini API: {}", e.getMessage(), e);
            return null;
        }
    }
}
