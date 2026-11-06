package taller.multimedia.backend.dto.chat;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChatResponse {
    private String answer;
    private String conversationId;
    private boolean blocked;
    private String action;

    public ChatResponse(String answer, String conversationId, boolean blocked) {
        this(answer, conversationId, blocked, null);
    }

    public ChatResponse(String answer, String conversationId, boolean blocked, String action) {
        this.answer = answer;
        this.conversationId = conversationId;
        this.blocked = blocked;
        this.action = action;
    }
}
