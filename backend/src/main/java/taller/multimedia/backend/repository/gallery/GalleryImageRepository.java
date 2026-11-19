package taller.multimedia.backend.repository.gallery;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import taller.multimedia.backend.model.gallery.GalleryImage;

import java.util.Collection;
import java.util.UUID;
import java.util.List;

/**
 * Storage of gallery images.
 */
public interface GalleryImageRepository extends JpaRepository<GalleryImage, UUID> {
    List<GalleryImage> findByGalleryId(UUID galleryId);

    Page<GalleryImage> findByGalleryIdOrderByCreatedAtDesc(UUID galleryId, Pageable pageable);

    List<GalleryImage> findByGalleryIdInOrderByCreatedAtDesc(Collection<UUID> galleryIds);

    /**
     * @param pageable how many images to return
     * @return images with their like count, most liked first and then newest
     */
    @Query("SELECT gi AS image, COUNT(il) AS likes " +
           "FROM GalleryImage gi LEFT JOIN gi.imageLikes il " +
           "GROUP BY gi " +
           "ORDER BY COUNT(il) DESC, gi.createdAt DESC")
    List<MostLikedImageProjection> findMostLiked(Pageable pageable);
}
