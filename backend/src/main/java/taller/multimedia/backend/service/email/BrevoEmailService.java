package taller.multimedia.backend.service.email;


import okhttp3.*;
import org.springframework.stereotype.Service;
import taller.multimedia.backend.config.BrevoProperties;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Sends transactional emails through the Brevo HTTP API, using the sender configured in {@link
 * BrevoProperties}.
 */
@Service
public class BrevoEmailService {

    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private static final int HTTP_TOO_MANY_REQUESTS = 429;

    private final BrevoProperties brevoProperties;
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;

    public BrevoEmailService(BrevoProperties brevoProperties) {
        this.brevoProperties = brevoProperties;
        this.httpClient = new OkHttpClient();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Sends one HTML email.
     *
     * @param toEmail recipient address
     * @param toName recipient name shown by the mail client
     * @param subject email subject
     * @param htmlContent rendered HTML body
     * @throws BrevoDailyLimitExceededException if Brevo answers 429 (daily quota or rate limit
     *     reached)
     * @throws IOException if the request fails or Brevo answers with any other error
     */
    public void sendEmail(String toEmail, String toName, String subject, String htmlContent) throws IOException {
        Map<String, Object> payload = new HashMap<>();

        Map<String, String> sender = new HashMap<>();
        sender.put("email", brevoProperties.getSenderEmail());
        sender.put("name", brevoProperties.getSenderName());
        payload.put("sender", sender);

        Map<String, String> recipient = new HashMap<>();
        recipient.put("email", toEmail);
        recipient.put("name", toName);
        payload.put("to", java.util.List.of(recipient));

        payload.put("subject", subject);
        payload.put("htmlContent", htmlContent);

        String jsonBody = objectMapper.writeValueAsString(payload);

        RequestBody body = RequestBody.create(jsonBody, JSON);
        Request request = new Request.Builder()
                .url(BREVO_URL)
                .addHeader("api-key", brevoProperties.getApiKey())
                .addHeader("accept", "application/json")
                .post(body)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "no details";
                if (response.code() == HTTP_TOO_MANY_REQUESTS) {
                    String retryAfter = response.header("Retry-After");
                    throw new BrevoDailyLimitExceededException(errorBody, retryAfter);
                }
                throw new IOException("Error sending email with Brevo: " + response.code() + " - " + errorBody);
            }
        }
    }

    /**
     * Thrown when Brevo rejects an email because the daily quota or the rate limit was reached, so
     * callers can stop sending instead of retrying every recipient.
     */
    public static class BrevoDailyLimitExceededException extends IOException {
        /**
         * @param errorBody response body returned by Brevo
         * @param retryAfter value of the {@code Retry-After} header in seconds, may be {@code null}
         */
        public BrevoDailyLimitExceededException(String errorBody, String retryAfter) {
            super(buildMessage(errorBody, retryAfter));
        }

        private static String buildMessage(String errorBody, String retryAfter) {
            String message = "Brevo daily limit or rate limit reached: " + errorBody;
            if (retryAfter != null && !retryAfter.isBlank()) {
                message += " Retry-After: " + retryAfter + " seconds.";
            }
            return message;
        }
    }
}
