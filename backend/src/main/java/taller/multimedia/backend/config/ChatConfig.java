package taller.multimedia.backend.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import com.google.genai.Client;
import com.google.genai.types.ClientOptions;
import okhttp3.OkHttpClient;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

/**
 * Configures the Google Gemini client used by the chat assistant.
 */
@Configuration
public class ChatConfig {
    /**
     * Creates the Gemini client only when an API key is configured.
     *
     * @param apiKey {@code spring.ai.google.genai.api-key}
     * @param connectTimeout {@code chat.model.connect-timeout}, 10 seconds by default
     * @param readTimeout {@code chat.model.read-timeout}, 60 seconds by default
     * @return the client
     */
    @Bean
    @org.springframework.boot.autoconfigure.condition.ConditionalOnExpression(
            "T(org.springframework.util.StringUtils).hasText('${spring.ai.google.genai.api-key:}')")
    public Client googleGenAiClient(@Value("${spring.ai.google.genai.api-key:}") String apiKey,
            @Value("${chat.model.connect-timeout:10s}") Duration connectTimeout,
            @Value("${chat.model.read-timeout:60s}") Duration readTimeout) {
        OkHttpClient httpClient = new OkHttpClient.Builder()
                .connectTimeout(connectTimeout)
                .readTimeout(readTimeout)
                .build();
        return Client.builder().apiKey(apiKey)
                .clientOptions(ClientOptions.builder().customHttpClient(httpClient).build())
                .build();
    }

    /**
     * @param builder chat client builder from Spring AI
     * @param promptResource system prompt
     * @param activeProfiles active profiles; with {@code dev} the prompts and answers are logged
     * @return the chat client, with temperature 0.3 and at most 400 tokens per answer
     * @throws IOException if the system prompt cannot be read
     */
    @Bean
    public ChatClient chatClient(ChatClient.Builder builder,
            @Value("classpath:prompts/system-prompt.txt") Resource promptResource,
            @Value("${spring.profiles.active:}") String activeProfiles) throws IOException {
        String systemPrompt = promptResource.getContentAsString(StandardCharsets.UTF_8);
        ChatClient.Builder configured = builder.defaultSystem(systemPrompt)
                .defaultOptions(ChatOptions.builder().temperature(0.3).maxTokens(400));
        if (java.util.Arrays.stream(activeProfiles.split(",")).anyMatch("dev"::equalsIgnoreCase)) {
            configured.defaultAdvisors(new SimpleLoggerAdvisor());
        }
        return configured.build();
    }
}
