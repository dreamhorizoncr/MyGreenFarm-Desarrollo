package taller.multimedia.backend.service.announcement;

import java.io.IOException;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

class GeminiResumenServiceTest {

    private MockWebServer mockWebServer;
    private GeminiResumenService geminiResumenService;

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        geminiResumenService = new GeminiResumenService(JsonMapper.builder().build());
        ReflectionTestUtils.setField(geminiResumenService, "apiKey", "test-api-key");
        ReflectionTestUtils.setField(geminiResumenService, "model", "gemini-3.5-flash-lite");
        ReflectionTestUtils.setField(geminiResumenService, "baseUrl", mockWebServer.url("/").toString());
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    @Test
    void generarResumen_devuelveElTextoCuandoLaRespuestaEsExitosa() {
        String responseBody = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          { "text": "Resumen generado de prueba." }
                        ]
                      }
                    }
                  ]
                }
                """;
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json"));

        String resumen = geminiResumenService.generarResumen("Contenido de la noticia de prueba.");

        assertThat(resumen).isEqualTo("Resumen generado de prueba.");
    }

    @Test
    void generarResumen_devuelveNullCuandoLaApiRespondeConError() {
        mockWebServer.enqueue(new MockResponse().setResponseCode(500));

        String resumen = geminiResumenService.generarResumen("Contenido de la noticia de prueba.");

        assertThat(resumen).isNull();
    }

    @Test
    void generarResumen_devuelveNullCuandoLaRespuestaNoTraeTexto() {
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody("{\"candidates\": []}")
                .addHeader("Content-Type", "application/json"));

        String resumen = geminiResumenService.generarResumen("Contenido de la noticia de prueba.");

        assertThat(resumen).isNull();
    }
}
