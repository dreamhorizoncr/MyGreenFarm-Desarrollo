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

@Configuration
public class ChatConfig {
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
                .clientOptions(ClientOptions.builder().httpClient(httpClient).build())
                .build();
    }

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
