package taller.multimedia.backend.controller.chat;

import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import taller.multimedia.backend.dto.chat.ChatRequest;
import taller.multimedia.backend.dto.chat.ChatResponse;
import taller.multimedia.backend.service.chat.ChatService;

/**
 * Chat assistant of the site. Visitors and signed-in staff may use it; what the assistant may talk
 * about depends on the user's role.
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * {@code POST /api/chat}: answers one message.
     *
     * @param request message, conversation ID and previous turns
     * @param authentication current user, or {@code null} for a visitor
     * @param acceptLanguage browser languages; Spanish by default
     * @return the assistant's reply, possibly with a booking or navigation action
     */
    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatRequest request,
            Authentication authentication,
            @RequestHeader(value = HttpHeaders.ACCEPT_LANGUAGE, defaultValue = "es") String acceptLanguage) {
        ChatResponse response = chatService.chat(request, authentication, acceptLanguage);
        return ResponseEntity.ok(response);
    }

    /**
     * {@code GET /api/chat/health}
     *
     * @return {@code ok} when the chat endpoint is reachable
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("ok");
    }
}
