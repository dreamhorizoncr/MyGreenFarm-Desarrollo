package taller.multimedia.backend.dto.gallery;


import java.util.UUID;

import lombok.Builder;
import lombok.Data;

/**
 * An image of a gallery with its like count.
 */
@Data
@Builder
public class GalleryImageResponse {
    private UUID id;
    private UUID galleryId;
    private String title;
    private String fileUrl;
    private String altText;
    private Integer likeCount;
}
