package taller.multimedia.backend.repository.gallery;

import java.util.UUID;

/**
 * Number of likes of one gallery image.
 */
public interface ImageLikeCountProjection {
    /**
     * @return image ID
     */
    UUID getImageId();
    /**
     * @return number of likes
     */
    long getTotal();
}