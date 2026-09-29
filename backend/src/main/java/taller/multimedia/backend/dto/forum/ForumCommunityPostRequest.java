package taller.multimedia.backend.dto.forum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ForumCommunityPostRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 40, message = "El nombre no puede superar los 40 caracteres")
    private String name;

    @NotBlank(message = "El contenido es obligatorio")
    @Size(max = 4000, message = "El contenido no puede superar los 4000 caracteres")
    private String content;
}
