package taller.multimedia.backend.repository.gallery;

import taller.multimedia.backend.model.gallery.ImageLike;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;

@Repository 
public interface ImageLikeRepository extends JpaRepository<ImageLike, UUID> {
    boolean existsByGalleryImagesIdAndAnonId(UUID galleryImagesId, String anonId);
    long countByGalleryImagesId(UUID imageId);

     @Transactional 
    void deleteByGalleryImagesIdAndAnonId(UUID galleryImagesId, String anonId);

    List<ImageLike> findByAnonId(String anonId);


    @Query("SELECT il.galleryImages.id AS imageId, COUNT(il) AS total " +
           "FROM ImageLike il " +
           "WHERE il.galleryImages.id IN :imageIds " +
           "GROUP BY il.galleryImages.id")
    List<ImageLikeCountProjection> countByGalleryImagesIdIn(@Param("imageIds") List<UUID> imageIds);
}
