package taller.multimedia.backend.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

@Component
public class ChatPromptProvider {
    private final String systemPrompt;

    public ChatPromptProvider(ResourceLoader resourceLoader) {
        Resource resource = resourceLoader.getResource("classpath:prompts/system-prompt.txt");
        try {
            this.systemPrompt = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to load the chat system prompt", exception);
        }
    }

    public String getSystemPrompt() {
        return systemPrompt;
    }
}
