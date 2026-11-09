package taller.multimedia.backend.repository.gallery;

import org.springframework.data.jpa.repository.JpaRepository;

import taller.multimedia.backend.model.gallery.CategoryGallery;

import java.util.UUID;

public interface CategoryGalleryRepository extends JpaRepository<CategoryGallery, UUID> {
    
}
