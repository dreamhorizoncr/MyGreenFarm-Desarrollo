package taller.multimedia.backend.repository.gallery;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import taller.multimedia.backend.model.gallery.GalleryImages;

import java.util.Collection;
import java.util.UUID;
import java.util.List;

public interface GalleryImageRepository extends JpaRepository<GalleryImages, UUID> {
    List<GalleryImages> findByGalleryId(UUID gallery);

    Page<GalleryImages> findByGalleryIdOrderByCreatedAtDesc(UUID galleryId, Pageable pageable);

    List<GalleryImages> findByGalleryIdInOrderByCreatedAtDesc(Collection<UUID> galleryIds);

    @Query("SELECT gi AS image, COUNT(il) AS likes " +
           "FROM GalleryImages gi LEFT JOIN gi.imageLikes il " +
           "GROUP BY gi " +
           "ORDER BY COUNT(il) DESC, gi.createdAt DESC")
    List<MostLikedImageProjection> findMostLiked(Pageable pageable);
}
