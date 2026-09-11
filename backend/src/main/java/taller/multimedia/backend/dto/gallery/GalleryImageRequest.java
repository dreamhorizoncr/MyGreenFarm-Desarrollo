package taller.multimedia.backend.dto.gallery;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

import lombok.Data;

@Data
public class GalleryImageRequest {

    @NotNull
    private UUID galleryId;

    @NotBlank(message = "El título es obligatorio")
    private String title;

    @NotBlank(message = "La imagen es obligatoria")
    private String urlImage;
}
