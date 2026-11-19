package taller.multimedia.backend.dto.chat;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * A message sent to the chat assistant, with the previous turns of the conversation so it keeps the
 * context.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {
    @Size(max = 500)
    private String message;

    private String conversationId;

    @Size(max = 12)
    @Valid
    private List<ChatTurn> history;
}
