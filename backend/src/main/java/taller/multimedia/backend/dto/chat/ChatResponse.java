package taller.multimedia.backend.dto.chat;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChatResponse {
    private String answer;
    private String conversationId;
    private boolean blocked;

    public ChatResponse(String answer, String conversationId, boolean blocked) {
        this.answer = answer;
        this.conversationId = conversationId;
        this.blocked = blocked;
    }
}
