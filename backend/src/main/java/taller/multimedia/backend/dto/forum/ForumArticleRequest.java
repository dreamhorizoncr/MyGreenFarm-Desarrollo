package taller.multimedia.backend.dto.forum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ForumArticleRequest {

    @NotBlank(message = "El título es obligatorio")
    @Size(max = 120, message = "El título no puede superar los 120 caracteres")
    private String title;

    @NotBlank(message = "El tema es obligatorio")
    @Size(max = 60, message = "El tema no puede superar los 60 caracteres")
    private String topic;

    @NotBlank(message = "El contenido es obligatorio")
    @Size(max = 4000, message = "El contenido no puede superar los 4000 caracteres")
    private String content;

    @Size(max = 120, message = "El nombre del autor no puede superar los 120 caracteres")
    private String authorName;

    @Size(max = 40, message = "El puesto del autor no puede superar los 40 caracteres")
    private String authorRole;

    @Size(max = 140, message = "El texto alternativo no puede superar los 140 caracteres")
    private String imageAlt;

    private boolean removeImage;
}
