package taller.multimedia.backend.repository.gallery;

import java.util.UUID;

public interface ImageLikeCountProjection {
    UUID getImageId();
    long getTotal();
}