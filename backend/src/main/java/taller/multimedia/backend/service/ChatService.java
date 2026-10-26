package taller.multimedia.backend.service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.MessageSource;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import taller.multimedia.backend.dto.chat.ChatRequest;
import taller.multimedia.backend.dto.chat.ChatResponse;
import taller.multimedia.backend.util.ProfanityFilter;

@Service
public class ChatService {
    public static final int MAX_MESSAGE_LENGTH = 500;
    private static final Logger log = LoggerFactory.getLogger(ChatService.class);
    private static final Pattern OFF_TOPIC = Pattern.compile("\\b(?:receta|cocinar|futbol|nba|politica electoral|partido politico|elecciones|criptomoneda|bitcoin|codigo python|java code|hackear|remedio|aborto|debate religioso|chiste|broma fuera de tema)\\b");
    private static final Pattern INTERNAL_DISCLOSURE = Pattern.compile("\\b(?:codigo fuente|fuente del codigo|endpoint|api interna|implementacion interna|arquitectura interna|instrucciones internas|configuracion interna)\\b");
    private static final Pattern ACCESS_INVITATION = Pattern.compile("\\b(?:inici(?:a|ar|e) sesion|ingres(?:a|ar) al sistema|cuenta (?:que tenga )?acceso|solicit(?:a|ar) acceso|sign in|log in|log into|account (?:with|that has) access|se connecter|connectez-vous)\\b");
    private static final Pattern MARKDOWN = Pattern.compile("\\[([^\\]]+)]\\([^)]*\\)|[*#`_~]+");
    private static final Pattern URL = Pattern.compile("(?i)\\b(?:https?://|www\\.)\\S+");

    private final ChatClient chatClient;
    private final ChatContextBuilder contextBuilder;
    private final MessageSource messages;

    public ChatService(ChatClient chatClient, ChatContextBuilder contextBuilder, MessageSource messages) {
        this.chatClient = chatClient;
        this.contextBuilder = contextBuilder;
        this.messages = messages;
    }

    public ChatResponse chat(ChatRequest request, Authentication authentication, String acceptLanguage) {
        String language = resolveLanguage(acceptLanguage);
        String conversationId = validConversationId(request == null ? null : request.getConversationId());
        String message = request == null ? null : request.getMessage();
        if (message == null || message.isBlank()) return response("chat.empty", language, conversationId, true);
        message = message.trim();
        if (message.length() > MAX_MESSAGE_LENGTH) return response("chat.maxLength", language, conversationId, true);
        if (ProfanityFilter.containsProfanity(message)) return response("chat.respectful", language, conversationId, true);
        if (isOffTopic(message)) return response("chat.safe", language, conversationId, true);
        String safeQuestion = message.replace("<pregunta>", "").replace("</pregunta>", "");
        try {
            String answer = chatClient.prompt()
                    .system(s -> s.text("Contexto de acceso:\n{ctx}\nIdioma de respuesta: {lang}")
                            .param("ctx", contextBuilder.buildContext(authentication))
                            .param("lang", languageName(language)))
                    .user("<pregunta>" + safeQuestion + "</pregunta>")
                    .call().content();
            if (answer == null || answer.isBlank()) answer = safeReply(language);
            else {
                String normalized = normalize(answer);
                if (ACCESS_INVITATION.matcher(normalized).find()) answer = localized("chat.privateData", language);
                else if (INTERNAL_DISCLOSURE.matcher(normalized).find()) answer = safeReply(language);
                answer = stripFormatting(answer);
                if (answer.isBlank()) answer = safeReply(language);
            }
            return new ChatResponse(answer, conversationId, false);
        } catch (Exception e) {
            log.error("Error al consultar el modelo", e);
            return response("chat.retry", language, conversationId, true);
        }
    }

    public static String validConversationId(String candidate) {
        if (candidate != null && !candidate.isBlank()) {
            try {
                UUID parsed = UUID.fromString(candidate);
                if (parsed.toString().equalsIgnoreCase(candidate)) return parsed.toString();
            }
            catch (IllegalArgumentException ignored) { }
        }
        return UUID.randomUUID().toString();
    }

    public static boolean isOffTopic(String message) {
        return message != null && OFF_TOPIC.matcher(normalize(message)).find();
    }

    public static String normalize(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
    }

    public static String resolveLanguage(String acceptLanguage) {
        if (acceptLanguage == null || acceptLanguage.isBlank()) return "es";
        String primary = acceptLanguage.split(",", 2)[0].split("-", 2)[0].trim().toLowerCase(Locale.ROOT);
        return Set.of("es", "en", "fr").contains(primary) ? primary : "es";
    }

    public static String stripFormatting(String value) {
        return URL.matcher(MARKDOWN.matcher(value).replaceAll("$1")).replaceAll("").trim();
    }

    public String localized(String key, String language) {
        return messages.getMessage(key, null, Locale.forLanguageTag(language));
    }

    private ChatResponse response(String key, String language, String conversationId, boolean blocked) {
        return new ChatResponse(localized(key, language), conversationId, blocked);
    }
    private String safeReply(String language) { return localized("chat.safe", language); }
    private static String languageName(String language) {
        return switch (language) { case "en" -> "English"; case "fr" -> "French"; default -> "Spanish"; };
    }
}
