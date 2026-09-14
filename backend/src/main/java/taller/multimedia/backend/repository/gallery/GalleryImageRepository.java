package taller.multimedia.backend.repository.gallery;

import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import taller.multimedia.backend.model.gallery.GalleryImages;

import java.util.UUID;
import java.util.List;

@Repository 
public interface GalleryImageRepository extends JpaRepository<GalleryImages, UUID> {
    List<GalleryImages> findByGalleryId(UUID gallery);

    Page<GalleryImages> findByGalleryIdOrderByCreatedAtDesc(UUID galleryId, Pageable pageable);
}
