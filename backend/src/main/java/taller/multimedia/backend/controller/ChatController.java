package taller.multimedia.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import taller.multimedia.backend.dto.chat.ChatRequest;
import taller.multimedia.backend.dto.chat.ChatResponse;
import taller.multimedia.backend.service.ChatService;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatRequest request,
            Authentication authentication,
            @RequestHeader(value = HttpHeaders.ACCEPT_LANGUAGE, defaultValue = "es") String acceptLanguage) {
        ChatResponse response = chatService.chat(request, authentication, acceptLanguage);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("ok");
    }
}
