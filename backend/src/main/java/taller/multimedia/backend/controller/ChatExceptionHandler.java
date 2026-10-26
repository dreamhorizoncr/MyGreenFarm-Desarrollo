package taller.multimedia.backend.controller;

import java.util.UUID;

import org.springframework.context.MessageSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import jakarta.servlet.http.HttpServletRequest;
import taller.multimedia.backend.dto.chat.ChatResponse;
import taller.multimedia.backend.service.ChatService;

@RestControllerAdvice(assignableTypes = ChatController.class)
public class ChatExceptionHandler {
    private final MessageSource messages;
    public ChatExceptionHandler(MessageSource messages) { this.messages = messages; }

    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    public ResponseEntity<ChatResponse> invalidRequest(Exception exception, HttpServletRequest request) {
        String language = ChatService.resolveLanguage(request.getHeader(HttpHeaders.ACCEPT_LANGUAGE));
        String message = messages.getMessage("chat.invalid", null, java.util.Locale.forLanguageTag(language));
        return ResponseEntity.badRequest().body(new ChatResponse(message, UUID.randomUUID().toString(), true));
    }
}
