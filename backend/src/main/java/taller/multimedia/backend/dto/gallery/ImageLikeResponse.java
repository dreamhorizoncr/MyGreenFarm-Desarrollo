package taller.multimedia.backend.dto.gallery;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Likes of a gallery image after a visitor liked or unliked it.
 */
@Data 
@AllArgsConstructor
public class ImageLikeResponse {
    private UUID galleryImagesId;
    private Integer totalLikes;
    private boolean liked;
}
