package taller.multimedia.backend.config;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.context.MessageSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import taller.multimedia.backend.dto.chat.ChatResponse;
import taller.multimedia.backend.service.chat.ChatService;

/**
 * Limits the chat to 10 messages per minute per signed-in user, or per IP address for visitors, to
 * protect the AI quota. Extra messages get a 429 with a chat reply in the user's language. Counters
 * live in memory.
 */
@Component
public class ChatRateLimitInterceptor implements HandlerInterceptor {
    private static final int LIMIT = 10;
    private static final long WINDOW_MILLIS = 60_000;
    private record Window(long started, int count) { }
    private final ConcurrentHashMap<String, Window> buckets = new ConcurrentHashMap<>();
    private final ObjectMapper mapper;
    private final MessageSource messages;

    public ChatRateLimitInterceptor(ObjectMapper mapper, MessageSource messages) {
        this.mapper = mapper; this.messages = messages;
    }

    /**
     * @param request incoming request; only {@code POST /api/chat} is limited
     * @param response response, written when the limit is exceeded
     * @param handler target handler
     * @return {@code false} when the limit is exceeded
     * @throws Exception if the response cannot be written
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!"POST".equalsIgnoreCase(request.getMethod()) || !"/api/chat".equals(request.getRequestURI())) return true;
        long now = Instant.now().toEpochMilli();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String key = authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                ? "ip:" + request.getRemoteAddr() : "user:" + authentication.getName();
        buckets.entrySet().removeIf(entry -> now - entry.getValue().started() >= WINDOW_MILLIS * 2);
        Window updated = buckets.compute(key, (ignored, old) -> old == null || now - old.started() >= WINDOW_MILLIS
                ? new Window(now, 1) : new Window(old.started(), old.count() + 1));
        if (updated.count() <= LIMIT) return true;
        String language = ChatService.resolveLanguage(request.getHeader(HttpHeaders.ACCEPT_LANGUAGE));
        String answer = messages.getMessage("chat.rateLimit", null, java.util.Locale.forLanguageTag(language));
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        mapper.writeValue(response.getOutputStream(), new ChatResponse(answer, ChatService.validConversationId(null), true));
        return false;
    }
}
