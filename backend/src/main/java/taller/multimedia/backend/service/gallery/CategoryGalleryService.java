package taller.multimedia.backend.service.gallery;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import taller.multimedia.backend.dto.gallery.CategoryGalleryRequest;
import taller.multimedia.backend.dto.gallery.CategoryGalleryResponse;
import taller.multimedia.backend.model.gallery.CategoryGallery;
import taller.multimedia.backend.model.gallery.Gallery;
import taller.multimedia.backend.repository.gallery.CategoryGalleryRepository;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryGalleryService {

    private final GalleryService galleryService;
    private final CategoryGalleryRepository categoryGalleryRepository;

    @Transactional
    public CategoryGalleryResponse create(CategoryGalleryRequest dto) {
        CategoryGallery category = new CategoryGallery();
        category.setTitle(dto.getTitle());

        CategoryGallery saved = categoryGalleryRepository.save(category);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CategoryGalleryResponse> getAll() {
        return categoryGalleryRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryGalleryResponse getById(UUID id) {
        return categoryGalleryRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con ID: " + id));
    }

    @Transactional
    public CategoryGalleryResponse update(UUID id, CategoryGalleryRequest dto) {
        CategoryGallery category = categoryGalleryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con ID: " + id));

        category.setTitle(dto.getTitle());

        CategoryGallery updated = categoryGalleryRepository.save(category);
        return mapToResponse(updated);
    }

    @Transactional
    public void delete(UUID id) {
        CategoryGallery category = categoryGalleryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con ID: " + id));

        // 1. Borrar cada galería de la categoría (y sus imágenes del bucket)
        for (Gallery gallery : category.getGalleries()) {
            galleryService.delete(gallery.getId());
        }

        // 2. Borrar la categoría
        categoryGalleryRepository.delete(category);
    }

    private CategoryGalleryResponse mapToResponse(CategoryGallery category) {
        CategoryGalleryResponse response = new CategoryGalleryResponse();
        response.setId(category.getId());
        response.setTitle(category.getTitle());
        return response;
    }
}