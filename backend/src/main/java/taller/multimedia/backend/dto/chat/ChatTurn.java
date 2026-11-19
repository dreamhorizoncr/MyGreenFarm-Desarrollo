package taller.multimedia.backend.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One previous turn of a chat conversation: who said it ({@code user} or {@code assistant}) and
 * what.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatTurn {
    @NotBlank
    @Size(max = 500)
    private String content;

    @NotBlank
    @Pattern(regexp = "user|assistant")
    private String role;
}
