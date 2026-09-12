package taller.multimedia.backend.dto.gallery;

import java.util.UUID;

import lombok.Data;

@Data
public class GalleryResponse {
    private UUID id;
    private String title;
    private String description;
    private GalleryImageResponse[] galleryImages;
}
