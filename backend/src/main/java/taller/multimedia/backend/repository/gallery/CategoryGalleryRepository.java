package taller.multimedia.backend.repository.gallery;

import org.springframework.data.jpa.repository.JpaRepository;

import taller.multimedia.backend.model.gallery.CategoryGallery;

import java.util.UUID;

/**
 * Storage of gallery categories.
 */
public interface CategoryGalleryRepository extends JpaRepository<CategoryGallery, UUID> {
    
}
