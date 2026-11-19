package taller.multimedia.backend.service.chat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

/**
 * Loads the chat assistant's system prompt from {@code classpath:prompts/system-prompt.txt} once at
 * startup.
 */
@Component
public class ChatPromptProvider {
    private final String systemPrompt;

    /**
     * Reads the prompt file.
     * @param resourceLoader loader used to resolve the classpath resource
     * @throws IllegalStateException if the prompt file cannot be read, which stops the application
     *     from starting
     */
    public ChatPromptProvider(ResourceLoader resourceLoader) {
        Resource resource = resourceLoader.getResource("classpath:prompts/system-prompt.txt");
        try {
            this.systemPrompt = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to load the chat system prompt", exception);
        }
    }

    /**
     * @return the system prompt text, as read at startup
     */
    public String getSystemPrompt() {
        return systemPrompt;
    }
}
