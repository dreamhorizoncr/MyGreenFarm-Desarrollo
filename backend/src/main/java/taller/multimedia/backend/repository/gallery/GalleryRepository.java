package taller.multimedia.backend.repository.gallery;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import taller.multimedia.backend.model.gallery.Gallery;

import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;

public interface GalleryRepository extends JpaRepository<Gallery, UUID> {
    Page<Gallery> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime date, Pageable pageable);
    List<Gallery> findByCategoryGalleryId(UUID category);

    Page<Gallery> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Gallery> findByCategoryGalleryIdOrderByCreatedAtDesc(UUID categoryId, Pageable pageable);

    List<Gallery> findByFeaturedTrue();

    long countByFeaturedTrue();
}
