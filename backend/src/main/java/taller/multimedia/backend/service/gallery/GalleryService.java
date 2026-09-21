package taller.multimedia.backend.service.gallery;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import taller.multimedia.backend.dto.gallery.GalleryImageResponse;
import taller.multimedia.backend.dto.gallery.GalleryRequest;
import taller.multimedia.backend.dto.gallery.GalleryResponse;
import taller.multimedia.backend.model.gallery.CategoryGallery;
import taller.multimedia.backend.model.gallery.Gallery;
import taller.multimedia.backend.repository.gallery.CategoryGalleryRepository;
import taller.multimedia.backend.repository.gallery.GalleryRepository;

import java.util.List;
import java.util.UUID;

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
    public Page<GalleryResponse> getAll(Pageable pageable) {
        return galleryRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<GalleryResponse> getByCategory(UUID categoryId, Pageable pageable) {
        return galleryRepository.findByCategoryGalleryIdOrderByCreatedAtDesc(categoryId, pageable)
                .map(this::mapToResponse);
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

        if (Boolean.TRUE.equals(dto.getFeatured()) && !Boolean.TRUE.equals(gallery.getFeatured())) {
            long currentFeaturedCount = galleryRepository.countByFeaturedTrue();
            if (currentFeaturedCount >= 3) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Ya existen 3 galerías destacadas. Debes desmarcar una antes de destacar otra.");
            }
        }

        gallery.setCategoryGallery(category);
        gallery.setTitle(dto.getTitle());
        gallery.setDescription(dto.getDescription());
        gallery.setFeatured(dto.getFeatured() != null ? dto.getFeatured() : false);

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

    @Transactional(readOnly = true)
    public List<GalleryResponse> getFeaturedGalleries() {
        return galleryRepository.findByFeaturedTrue()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private GalleryResponse mapToResponse(Gallery gallery) {
        GalleryResponse response = new GalleryResponse();
        response.setId(gallery.getId());
        response.setTitle(gallery.getTitle());
        response.setDescription(gallery.getDescription());
        response.setFeatured(gallery.getFeatured());
        response.setGalleryImages(
                galleryImageService.getImagesByGallery(gallery.getId(), PageRequest.of(0, 10)).getContent().toArray(new GalleryImageResponse[0]));
        return response;
    }

}