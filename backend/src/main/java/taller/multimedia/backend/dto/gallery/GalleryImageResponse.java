package taller.multimedia.backend.dto.gallery;


import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GalleryImageResponse {
    private UUID id;
    private UUID galleryId;
    private String title;
    private String fileUrl;
}
