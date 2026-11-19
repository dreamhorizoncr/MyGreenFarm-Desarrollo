package taller.multimedia.backend.dto.chat;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Reply of the chat assistant. It may carry an action for the frontend, such as starting the
 * booking form or navigating to a section.
 */
@Data
@NoArgsConstructor
public class ChatResponse {
    private String answer;
    private String conversationId;
    private boolean blocked;
    private String action;
    private String target;

    /**
     * @param answer text shown in the chat
     * @param conversationId conversation ID
     * @param blocked whether the message was rejected before reaching the AI
     */
    public ChatResponse(String answer, String conversationId, boolean blocked) {
        this(answer, conversationId, blocked, null, null);
    }

    /**
     * @param answer text shown in the chat
     * @param conversationId conversation ID
     * @param blocked whether the message was rejected
     * @param action action for the frontend, for example {@code START_BOOKING}
     */
    public ChatResponse(String answer, String conversationId, boolean blocked, String action) {
        this(answer, conversationId, blocked, action, null);
    }

    /**
     * @param answer text shown in the chat
     * @param conversationId conversation ID
     * @param blocked whether the message was rejected
     * @param action action for the frontend, for example {@code NAVIGATE}
     * @param target section the action points to
     */
    public ChatResponse(String answer, String conversationId, boolean blocked, String action, String target) {
        this.answer = answer;
        this.conversationId = conversationId;
        this.blocked = blocked;
        this.action = action;
        this.target = target;
    }
}
