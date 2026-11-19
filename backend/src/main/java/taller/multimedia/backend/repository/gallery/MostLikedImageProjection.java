package taller.multimedia.backend.repository.gallery;

import taller.multimedia.backend.model.gallery.GalleryImage;

/**
 * A gallery image with its number of likes.
 */
public interface MostLikedImageProjection {
    /**
     * @return the image
     */
    GalleryImage getImage();
    /**
     * @return number of likes
     */
    long getLikes();
}
