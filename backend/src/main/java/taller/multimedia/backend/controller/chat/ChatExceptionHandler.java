package taller.multimedia.backend.controller.chat;

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
import taller.multimedia.backend.service.chat.ChatService;

/**
 * Answers invalid chat requests with a normal chat reply in the user's language, so the chat window
 * can show it like any other answer.
 */
@RestControllerAdvice(assignableTypes = ChatController.class)
public class ChatExceptionHandler {
    private final MessageSource messages;
    public ChatExceptionHandler(MessageSource messages) { this.messages = messages; }

    /**
     * @param exception validation or parsing error
     * @param request request, for its language
     * @return 400 with a blocked chat reply
     */
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    public ResponseEntity<ChatResponse> invalidRequest(Exception exception, HttpServletRequest request) {
        String language = ChatService.resolveLanguage(request.getHeader(HttpHeaders.ACCEPT_LANGUAGE));
        String message = messages.getMessage("chat.invalid", null, java.util.Locale.forLanguageTag(language));
        return ResponseEntity.badRequest().body(new ChatResponse(message, UUID.randomUUID().toString(), true));
    }
}
