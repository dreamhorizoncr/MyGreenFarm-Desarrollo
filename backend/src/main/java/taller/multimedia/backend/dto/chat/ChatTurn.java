package taller.multimedia.backend.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
