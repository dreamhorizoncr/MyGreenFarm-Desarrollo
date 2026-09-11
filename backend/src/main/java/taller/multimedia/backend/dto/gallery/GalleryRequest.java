package taller.multimedia.backend.dto.gallery;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.Data;

import java.util.UUID;

@Data
public class GalleryRequest {

    @NotNull 
    private UUID categoryId;

    @NotBlank(message = "El título es obligatorio")
    @Size(min = 5, max = 70, message = "El título debe tener entre 50 y 70 caracteres")
    private String title;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(min = 20, max = 200, message = "El contenido no puede superar los 200 caracteres")
    private String description;

}
