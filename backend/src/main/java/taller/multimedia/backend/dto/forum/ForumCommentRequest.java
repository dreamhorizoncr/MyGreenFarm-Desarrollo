package taller.multimedia.backend.dto.forum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ForumCommentRequest {

    @NotBlank(message = "El alias es obligatorio")
    @Size(max = 40, message = "El alias no puede superar los 40 caracteres")
    private String alias;

    @NotBlank(message = "El contenido es obligatorio")
    @Size(max = 4000, message = "El contenido no puede superar los 4000 caracteres")
    private String content;
}
