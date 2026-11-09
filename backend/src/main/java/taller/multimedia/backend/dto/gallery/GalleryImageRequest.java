package taller.multimedia.backend.dto.gallery;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

import lombok.Data;

@Data
public class GalleryImageRequest {

    @NotNull
    private UUID galleryId;

    @NotBlank(message = "The title is required")
    private String title;

    @NotBlank(message = "The image is required")
    private String urlImage;
}
