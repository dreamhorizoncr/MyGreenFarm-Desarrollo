package taller.multimedia.backend.service.gallery;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import taller.multimedia.backend.dto.gallery.GalleryImageResponse;
import taller.multimedia.backend.dto.gallery.GalleryRequest;
import taller.multimedia.backend.dto.gallery.GalleryResponse;
import taller.multimedia.backend.model.gallery.CategoryGallery;
import taller.multimedia.backend.model.gallery.Gallery;
import taller.multimedia.backend.repository.gallery.CategoryGalleryRepository;
import taller.multimedia.backend.repository.gallery.GalleryRepository;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GalleryService {

    private final GalleryImageService galleryImageService;
    private final GalleryRepository galleryRepository;
    private final CategoryGalleryRepository categoryGalleryRepository;

    @Transactional
    public GalleryResponse create(GalleryRequest dto) {
        CategoryGallery category = categoryGalleryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con ID: " + dto.getCategoryId()));

        Gallery gallery = new Gallery();
        gallery.setCategoryGallery(category);
        gallery.setTitle(dto.getTitle());
        gallery.setDescription(dto.getDescription());

        Gallery saved = galleryRepository.save(gallery);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<GalleryResponse> getAll() {
        return galleryRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GalleryResponse> getByCategory(UUID categoryId) {
        return galleryRepository.findByCategoryGalleryIdOrderByCreatedAtDesc(categoryId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GalleryResponse getById(UUID id) {
        return galleryRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Galería no encontrada con ID: " + id));
    }

    @Transactional
    public GalleryResponse update(UUID id, GalleryRequest dto) {
        Gallery gallery = galleryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Galería no encontrada con ID: " + id));

        CategoryGallery category = categoryGalleryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con ID: " + dto.getCategoryId()));

        gallery.setCategoryGallery(category);
        gallery.setTitle(dto.getTitle());
        gallery.setDescription(dto.getDescription());

        Gallery updated = galleryRepository.save(gallery);
        return mapToResponse(updated);
    }

    @Transactional
    public void delete(UUID id) {
        Gallery gallery = galleryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Galería no encontrada con ID: " + id));

        // Borrar primero los archivos físicos del bucket usando el servicio de imágenes
        galleryImageService.deleteAllImagesByGallery(id);

        // Borrar la galería (y por cascada se limpian los registros de la BD)
        galleryRepository.delete(gallery);
    }

    private GalleryResponse mapToResponse(Gallery gallery) {
        GalleryResponse response = new GalleryResponse();
        response.setId(gallery.getId());
        response.setTitle(gallery.getTitle());
        response.setDescription(gallery.getDescription());
        response.setGalleryImages(
                galleryImageService.getImagesByGallery(gallery.getId()).toArray(new GalleryImageResponse[0]));
        return response;
    }
}