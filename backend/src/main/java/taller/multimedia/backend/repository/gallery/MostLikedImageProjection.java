package taller.multimedia.backend.repository.gallery;

import taller.multimedia.backend.model.gallery.GalleryImages;

public interface MostLikedImageProjection {
    GalleryImages getImage();
    long getLikes();
}
