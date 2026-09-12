package taller.multimedia.backend.dto.gallery;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Data;

@Data
public class CategoryGalleryRequest {

    @NotBlank(message = "El título es obligatorio")
    @Size(min = 3, max = 70, message = "El título debe tener entre 3 y 70 caracteres")
    private String title;
}