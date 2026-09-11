package taller.multimedia.backend.repository.gallery;

import taller.multimedia.backend.model.gallery.ImageLike;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository 
public interface ImageLikeRepository extends JpaRepository<ImageLike, UUID> {
    boolean existsByGalleryImagesIdAndAnonId(UUID galleryImagesId, String anonId);
    long countByGalleryImagesId(UUID imageId);
}
