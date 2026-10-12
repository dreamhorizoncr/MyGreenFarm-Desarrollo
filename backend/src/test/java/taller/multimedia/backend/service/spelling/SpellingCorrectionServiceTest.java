package taller.multimedia.backend.service.spelling;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

class SpellingCorrectionServiceTest {

    private final ObjectMapper objectMapper = JsonMapper.builder().build();
    private MockWebServer mockWebServer;
    private SpellingCorrectionService spellingCorrectionService;

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        spellingCorrectionService = new SpellingCorrectionService(objectMapper);
        ReflectionTestUtils.setField(spellingCorrectionService, "apiKey", "test-api-key");
        ReflectionTestUtils.setField(spellingCorrectionService, "model", "gemini-3.5-flash-lite");
        ReflectionTestUtils.setField(spellingCorrectionService, "baseUrl", mockWebServer.url("/").toString());
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    // Respuesta de Gemini cuyo texto es el JSON con los campos corregidos.
    private void enqueueCorrection(Map<String, String> corrected) {
        String text = objectMapper.writeValueAsString(corrected);
        String body = objectMapper.writeValueAsString(Map.of(
                "candidates", java.util.List.of(Map.of(
                        "content", Map.of("parts", java.util.List.of(Map.of("text", text)))))));
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody(body)
                .addHeader("Content-Type", "application/json"));
    }

    private Map<String, String> texts(String title, String content) {
        Map<String, String> texts = new LinkedHashMap<>();
        texts.put("title", title);
        texts.put("content", content);
        return texts;
    }

    @Test
    void correct_returnsOnlyFieldsThatChanged() {
        enqueueCorrection(Map.of(
                "title", "Día de la madre",
                "content", "Celebramos con las mamás.\n¡Los esperamos!"));

        Map<String, String> result = spellingCorrectionService.correct(
                texts("Dia de la madre", "Celebramos con las mamás.\nlos esperamos!"));

        assertThat(result).containsEntry("title", "Día de la madre")
                .containsEntry("content", "Celebramos con las mamás.\n¡Los esperamos!");
    }

    @Test
    void correct_skipsFieldsThatAreAlreadyCorrect() {
        enqueueCorrection(Map.of("title", "Día de la madre", "content", "Texto correcto."));

        Map<String, String> result = spellingCorrectionService.correct(texts("Dia de la madre", "Texto correcto."));

        assertThat(result).containsOnlyKeys("title");
    }

    @Test
    void correct_discardsCorrectionThatRewritesTooMuch() {
        enqueueCorrection(Map.of(
                "title", "Un título totalmente distinto y mucho más largo que el original",
                "content", "Texto."));

        Map<String, String> result = spellingCorrectionService.correct(texts("Paseo", "Texto."));

        assertThat(result).isEmpty();
    }

    @Test
    void correct_discardsCorrectionThatChangesLineBreaks() {
        enqueueCorrection(Map.of("title", "Paseo", "content", "Primera línea. Segunda línea."));

        Map<String, String> result = spellingCorrectionService.correct(texts("Paseo", "Primera linea.\nSegunda linea."));

        assertThat(result).isEmpty();
    }

    @Test
    void correct_discardsCorrectionWithHtml() {
        enqueueCorrection(Map.of("title", "<b>Paseo</b>", "content", "Texto."));

        Map<String, String> result = spellingCorrectionService.correct(texts("Paseo", "Texto."));

        assertThat(result).isEmpty();
    }

    @Test
    void correct_returnsEmptyWhenApiFails() {
        mockWebServer.enqueue(new MockResponse().setResponseCode(429));

        Map<String, String> result = spellingCorrectionService.correct(texts("Dia de la madre", "Texto."));

        assertThat(result).isEmpty();
    }

    @Test
    void correct_doesNotCallApiWhenThereIsNothingToCorrect() {
        Map<String, String> result = spellingCorrectionService.correct(texts("  ", null));

        assertThat(result).isEmpty();
        assertThat(mockWebServer.getRequestCount()).isZero();
    }
}
