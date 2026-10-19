package taller.multimedia.backend.service.forum;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import taller.multimedia.backend.exception.InvalidFieldException;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ForumModerationServiceTest {

    private final ObjectMapper objectMapper = JsonMapper.builder().build();
    private MockWebServer mockWebServer;
    private ForumModerationService moderationService;

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        moderationService = new ForumModerationService(objectMapper);
        ReflectionTestUtils.setField(moderationService, "apiKey", "test-api-key");
        ReflectionTestUtils.setField(moderationService, "model", "gemini-3.5-flash-lite");
        ReflectionTestUtils.setField(moderationService, "baseUrl", mockWebServer.url("/").toString());
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    private void enqueueVerdict(boolean appropriate) {
        String text = objectMapper.writeValueAsString(Map.of("appropriate", appropriate));
        String body = objectMapper.writeValueAsString(Map.of(
                "candidates", List.of(Map.of(
                        "content", Map.of("parts", List.of(Map.of("text", text)))))));
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody(body)
                .addHeader("Content-Type", "application/json"));
    }

    private void enqueueStatus(int status) {
        mockWebServer.enqueue(new MockResponse().setResponseCode(status));
    }

    @Test
    void assertAppropriateName_usesSearchGroundingWhenAvailable() throws InterruptedException {
        enqueueVerdict(true);

        assertThatCode(() -> moderationService.assertAppropriateName("alias", "Mamá de Sofi"))
                .doesNotThrowAnyException();

        RecordedRequest request = mockWebServer.takeRequest();
        assertThat(request.getBody().readUtf8()).contains("google_search");
        assertThat(mockWebServer.getRequestCount()).isEqualTo(1);
    }

    @Test
    void assertAppropriateName_retriesWithoutSearchWhenQuotaExceeded() throws InterruptedException {
        enqueueStatus(429);
        enqueueVerdict(true);

        assertThatCode(() -> moderationService.assertAppropriateName("alias", "Mamá de Sofi"))
                .doesNotThrowAnyException();

        assertThat(mockWebServer.takeRequest().getBody().readUtf8()).contains("google_search");
        assertThat(mockWebServer.takeRequest().getBody().readUtf8()).doesNotContain("google_search");
    }

    @Test
    void assertAppropriateName_stillRejectsOffensiveNameAfterFallback() {
        enqueueStatus(429);
        enqueueVerdict(false);

        InvalidFieldException ex = assertThrows(InvalidFieldException.class,
                () -> moderationService.assertAppropriateName("alias", "Nombre ofensivo"));

        assertThat(ex.getMessage()).contains("Ese nombre no cumple");
    }

    @Test
    void assertAppropriateName_reportsUnavailableWhenFallbackAlsoFails() {
        enqueueStatus(429);
        enqueueStatus(429);

        InvalidFieldException ex = assertThrows(InvalidFieldException.class,
                () -> moderationService.assertAppropriateName("alias", "Mamá de Sofi"));

        assertThat(ex.getMessage()).contains("No se pudo verificar");
        assertThat(mockWebServer.getRequestCount()).isEqualTo(2);
    }

    @Test
    void assertCommentRelevant_doesNotRetryOnQuotaExceeded() {
        enqueueStatus(429);

        assertThrows(InvalidFieldException.class,
                () -> moderationService.assertCommentRelevant("Crianza", "Rutinas", "Muy útil, gracias"));

        assertThat(mockWebServer.getRequestCount()).isEqualTo(1);
    }
}
