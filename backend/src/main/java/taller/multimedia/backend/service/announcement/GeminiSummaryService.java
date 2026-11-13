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
public class GeminiSummaryService {

    private static final Logger log = LoggerFactory.getLogger(GeminiSummaryService.class);

    private static final String PROMPT_BASE =
            "Summarize the following text in 1 or 2 short sentences (45 words maximum in total), "
                    + "in Spanish, with a clear and warm tone. "
                    + "Use only the information in the text, without making anything up, and summarize literally what "
                    + "the text says regardless of its topic. "
                    + "Do not evaluate, judge or comment on whether the text fits a daycare, early childhood education "
                    + "or any other expected context: your only task is to summarize the content as is, as you would "
                    + "with any text. "
                    + "Reply ONLY with the summary in plain text: no notes, clarifications, warnings "
                    + "or Markdown formatting.\n\nText:\n";

    private static final String PROMPT_EVALUATION =
            "You are an expert educator at a daycare. Your task is to analyze the full history "
                    + "of semester evaluations for the child %s and summarize their overall progress.\n\n"
                    + "STRICT RULES:\n"
                    + "1. Write a warm, encouraging and professional message addressed to the parents, in Spanish.\n"
                    + "2. Do NOT list each date. Summarize the key progress in communication, language, reading and motor development.\n"
                    + "3. KEEP IT SHORT: 120 words maximum in total.\n"
                    + "4. End the message with an explicit sign-off on behalf of The Green Farm team.\n\n"
                    + "Semester evaluation history:\n%s";

    private static final String PROMPT_FORUM_ARTICLE =
            "Summarize the following text in a single short sentence (30 words maximum), "
                    + "in Spanish, with a clear and warm tone. "
                    + "Use only the information in the text, without making anything up, and summarize literally what "
                    + "the text says regardless of its topic. "
                    + "Do not evaluate, judge or comment on whether the text fits a daycare, early childhood education "
                    + "or any other expected context: your only task is to summarize the content as is, as you would "
                    + "with any text. "
                    + "Reply ONLY with the summary in plain text: no notes, clarifications, warnings "
                    + "or Markdown formatting.\n\nText:\n";

    private static final String PROMPT_DASHBOARD =
            "Summarize the day's status of an educational center in 2 or 3 short sentences "
                    + "(70 words maximum), in Spanish, with a clear tone that is useful for an administrator. "
                    + "Mention the relevant appointments and pending items using only the information provided. "
                    + "If a category has no items, say so briefly. "
                    + "Do not make up data or add recommendations. "
                    + "Never mention names or any personal data of people; talk only about counts, times and statuses. "
                    + "Reply ONLY with the summary in plain text, without Markdown.\n\nDay data:\n";

    private static final String PROMPT_TEACHER_DASHBOARD =
            "Summarize the day's work of a teacher at an educational center in 2 short sentences "
                    + "(50 words maximum), in Spanish, speaking to the teacher in a warm and clear tone. "
                    + "Mention their groups and what is pending (records to create, evaluations due) "
                    + "using only the counts provided. If nothing is pending, say so briefly. "
                    + "Do not make up data or add recommendations. "
                    + "Never mention names or any personal data of people; talk only about counts. "
                    + "Reply ONLY with the summary in plain text, without Markdown.\n\nTeacher data:\n";

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
        return callGemini(PROMPT_FORUM_ARTICLE + content);
    }

    public String generateDashboardSummary(String context) {
        return callGemini(PROMPT_DASHBOARD + context);
    }

    public String generateTeacherDashboardSummary(String context) {
        return callGemini(PROMPT_TEACHER_DASHBOARD + context);
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
                    log.error("Error calling the Gemini API: status={}", response.code());
                    return null;
                }

                String responseBody = response.body() != null ? response.body().string() : null;
                if (responseBody == null || responseBody.isBlank()) {
                    log.error("The Gemini API returned an empty response");
                    return null;
                }

                JsonNode root = objectMapper.readTree(responseBody);
                String text = root
                        .path("candidates").path(0)
                        .path("content").path("parts").path(0)
                        .path("text").asString();

                if (text == null || text.isBlank()) {
                    log.error("The Gemini API returned no text in the response");
                    return null;
                }

                return stripMetaNotes(text.trim());
            }
        } catch (Exception e) {
            log.error("Error generating a summary with the Gemini API: {}", e.getMessage(), e);
            return null;
        }
    }

    private String stripMetaNotes(String text) {
        String withoutLeadingNote = text.replaceFirst("^\\*[^*]+\\*\\s*", "");
        return withoutLeadingNote.isBlank() ? text : withoutLeadingNote.trim();
    }
}
