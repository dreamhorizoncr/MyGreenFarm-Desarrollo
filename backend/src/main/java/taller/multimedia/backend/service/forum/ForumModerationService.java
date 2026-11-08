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
            "We could not publish the content because it does not follow the forum rules.";
    private static final String NAME_REJECTED_MESSAGE =
            "That name does not follow the forum rules. Choose another one to continue.";
    private static final String UNAVAILABLE_MESSAGE =
            "The content could not be checked right now. Try again in a few seconds.";
    private static final String EMOJI_REJECTED_MESSAGE =
            "Emojis are not allowed in the forum. Remove them and try again.";

    private static final Pattern EMOJI_PATTERN = Pattern.compile(
            "[\\x{1F300}-\\x{1FAFF}\\x{2600}-\\x{27BF}\\x{1F1E6}-\\x{1F1FF}\\x{2B00}-\\x{2BFF}\\x{FE0F}\\x{200D}]");

    private static final String SPELLING_INSTRUCTION =
            "- \"correctedContent\" is the same message with its spelling, accents and punctuation corrected. "
                    + "Do not change the meaning, tone, words, language or style (informal is fine); "
                    + "fix only obvious spelling mistakes. If there are no mistakes, return the text unchanged.";

    private static final String CONTEXT =
            "You moderate the forum of an early childhood education center in Costa Rica "
                    + "(families with children aged 0 to 12). ";

    private static final String PROFANITY_RULES =
            "Reject profanity, insults or sexual language in Spanish or English, even when misspelled, "
                    + "abbreviated or disguised with numbers, symbols or spaces. Examples: Costa Rica: malparido, "
                    + "hijueputa, hp, carepicha, picha, playo, zorra, puta, verga, culo, mierda, pendejo, huevón; "
                    + "Mexico: chingar, pinche, culero, joto, alv; Colombia: gonorrea, carechimba, pirobo; "
                    + "Argentina: boludo, pelotudo, forro, conchudo; Chile: weón, culiao, ctm; Venezuela: coño, "
                    + "mamagüevo, mmg; Central America: cerote; Spain: gilipollas, joder; English: fuck, shit, bitch, "
                    + "asshole, dick, pussy, wtf, racial or homophobic slurs. Allow colloquial speech that is not "
                    + "rude: mae, maje, güey, pura vida, tuanis, diay, brete, chunche, güila. "
                    + "Also reject sexual, violent or discriminatory content, harassment, spam, advertising or "
                    + "personal data of third parties. ";

    private static final String APPROPRIATE_PROMPT =
            CONTEXT + "Evaluate this community wall post.\n\n"
                    + "Post:\n\"%s\"\n\n"
                    + "Rules: " + PROFANITY_RULES
                    + "Talking about politics (parties, candidates, governments), proselytizing or mocking religion "
                    + "is not allowed. Courtesies such as \"Dios los bendiga\" or \"Feliz Navidad\" are allowed.\n\n"
                    + "Reply ONLY with a single-line JSON, with no extra text or code blocks:\n"
                    + "{\"appropriate\": true|false, \"correctedContent\": \"...\"}\n"
                    + "- \"appropriate\" is false if it breaks any rule.\n"
                    + SPELLING_INSTRUCTION;

    private static final String COMMENT_PROMPT =
            CONTEXT + "Evaluate this comment on an article from the center's blog.\n\n"
                    + "Article topic: \"%s\"\n"
                    + "Article title: \"%s\"\n"
                    + "Comment:\n\"%s\"\n\n"
                    + "Rules: " + PROFANITY_RULES
                    + "Mentioning political or religious figures, or talking about politics or religion, is only "
                    + "allowed if the article is about that topic and the comment is respectful; otherwise reject it. "
                    + "Mockery, insults and political or religious propaganda are never allowed. Courtesies such as "
                    + "\"Dios los bendiga\" are allowed.\n\n"
                    + "Reply ONLY with a single-line JSON, with no extra text or code blocks:\n"
                    + "{\"appropriate\": true|false, \"onTopic\": true|false, \"correctedContent\": \"...\"}\n"
                    + "- \"appropriate\" is false if it breaks any rule.\n"
                    + "- \"onTopic\" is false if the comment has no reasonable relation to the article's topic or "
                    + "title.\n"
                    + SPELLING_INSTRUCTION;

    private static final String NAME_PROMPT =
            CONTEXT + "Evaluate this name or alias that someone uses to sign in the forum.\n\n"
                    + "Name:\n\"%s\"\n\n"
                    + "Analyze three criteria separately:\n"
                    + "1. \"offensive\": it contains profanity or sexual or offensive language, even if disguised.\n"
                    + "2. \"doubleMeaning\": it looks like a normal first and last name, but read aloud or with its "
                    + "parts joined it forms a sexual, vulgar or mocking phrase or word, or one that alludes to child "
                    + "abuse, in Spanish or English (the typical fake joke names).\n"
                    + "3. \"impersonation\": the full name, meaning the first name and last name together, belongs "
                    + "to a very well-known figure, or is their known nickname, or is the figure's last name used "
                    + "alone as an alias. This includes presidents and former presidents of any country, well-known "
                    + "Costa Rican politicians (legislators, ministers, mayors), religious figures (Dios, Jesucristo, "
                    + "la Virgen, el Papa, Mahoma, Buda, Satanás) and criminals or controversial historical figures. "
                    + "It also counts if it imitates one of those figures with changed letters: Donald Prompt, Donal "
                    + "Trum, Obamna, Nayib Bukelele, Jesu Cristo.\n"
                    + "   Sharing only the last name or only the first name with a figure is NOT impersonation. "
                    + "Thousands of families use those last names and a parent can be called that with no bad "
                    + "intent: María Escobar, Marta Trump, Carlos Bukele, Ana Castro, Luis Arias and Jesús "
                    + "Rodríguez are ordinary people. It does count if the full name is that of a known relative or "
                    + "associate of the figure. It does not count that a little-known person has the same name. If "
                    + "you do not know whether a full name belongs to a real politician, use "
                    + "search; when in doubt with a normal first and last name, it is not impersonation.\n\n"
                    + "Normal nicknames are valid (Mamá de Sofi, Familia Rojas).\n\n"
                    + "Reply ONLY with a single-line JSON, with no extra text or code blocks:\n"
                    + "{\"offensive\": true|false, \"doubleMeaning\": true|false, \"impersonation\": true|false, "
                    + "\"appropriate\": true|false}\n"
                    + "- \"appropriate\" is true only if all three criteria are false.";

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
                    log.warn("Gemini rejected Google Search due to quota (429); moderating without search");
                    return callGemini(fieldName, prompt, false);
                }
                if (!response.isSuccessful()) {
                    log.error("Error calling the Gemini API for moderation: status={}", response.code());
                    throw new InvalidFieldException(fieldName, UNAVAILABLE_MESSAGE);
                }

                String responseBody = response.body() != null ? response.body().string() : null;
                if (responseBody == null || responseBody.isBlank()) {
                    log.error("The Gemini API returned an empty moderation response");
                    throw new InvalidFieldException(fieldName, UNAVAILABLE_MESSAGE);
                }

                JsonNode root = objectMapper.readTree(responseBody);

                if (root.path("candidates").isEmpty()) {
                    log.warn("Gemini blocked the content to moderate: {}", root.path("promptFeedback"));
                    throw new InvalidFieldException(fieldName, REJECTED_MESSAGE);
                }

                String text = root
                        .path("candidates").path(0)
                        .path("content").path("parts").path(0)
                        .path("text").asString();

                if (text == null || text.isBlank()) {
                    log.error("The Gemini API returned no text in the moderation response");
                    throw new InvalidFieldException(fieldName, UNAVAILABLE_MESSAGE);
                }

                return objectMapper.readTree(extractJson(text));
            }
        } catch (InvalidFieldException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error moderating content with the Gemini API: {}", e.getMessage());
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
