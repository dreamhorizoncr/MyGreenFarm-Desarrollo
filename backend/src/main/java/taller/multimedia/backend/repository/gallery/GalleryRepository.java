package taller.multimedia.backend.repository.gallery;

import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import taller.multimedia.backend.model.gallery.Gallery;

import java.util.List;
import java.util.UUID;

@Repository 
public interface GalleryRepository extends JpaRepository<Gallery, UUID>{
    List<Gallery> findByCategoryGalleryId(UUID category);
}
