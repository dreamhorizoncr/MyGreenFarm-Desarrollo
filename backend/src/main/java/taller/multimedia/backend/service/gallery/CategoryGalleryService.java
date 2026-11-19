package taller.multimedia.backend.service.gallery;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import taller.multimedia.backend.dto.gallery.CategoryGalleryRequest;
import taller.multimedia.backend.dto.gallery.CategoryGalleryResponse;
import taller.multimedia.backend.model.gallery.CategoryGallery;
import taller.multimedia.backend.model.gallery.Gallery;
import taller.multimedia.backend.repository.gallery.CategoryGalleryRepository;
import taller.multimedia.backend.util.Sanitizer;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Manages the categories that group photo galleries.
 */
@Service
@RequiredArgsConstructor
public class CategoryGalleryService {

    private final GalleryService galleryService;
    private final CategoryGalleryRepository categoryGalleryRepository;

    /**
     * @param request category title, which is sanitized
     * @return the created category
     * @throws taller.multimedia.backend.exception.InvalidFieldException if the title is unsafe
     */
    @Transactional
    public CategoryGalleryResponse create(CategoryGalleryRequest request) {
        CategoryGallery category = new CategoryGallery();
        category.setTitle(Sanitizer.requireClean("title", request.getTitle()));

        CategoryGallery saved = categoryGalleryRepository.save(category);
        return mapToResponse(saved);
    }

    /**
     * @return all gallery categories
     */
    @Transactional(readOnly = true)
    public List<CategoryGalleryResponse> getAll() {
        return categoryGalleryRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * @param id category ID
     * @return the category
     * @throws RuntimeException if it does not exist
     */
    @Transactional(readOnly = true)
    public CategoryGalleryResponse getById(UUID id) {
        return categoryGalleryRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + id));
    }

    /**
     * Renames a category.
     *
     * @param id category ID
     * @param request new title, which is sanitized
     * @return the updated category
     * @throws RuntimeException if the category does not exist
     * @throws taller.multimedia.backend.exception.InvalidFieldException if the title is unsafe
     */
    @Transactional
    public CategoryGalleryResponse update(UUID id, CategoryGalleryRequest request) {
        CategoryGallery category = categoryGalleryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + id));

        category.setTitle(Sanitizer.requireClean("title", request.getTitle()));

        CategoryGallery updated = categoryGalleryRepository.save(category);
        return mapToResponse(updated);
    }

    /**
     * Deletes a category together with all of its galleries and their images.
     *
     * @param id category ID
     * @throws RuntimeException if the category does not exist
     */
    @Transactional
    public void delete(UUID id) {
        CategoryGallery category = categoryGalleryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + id));

        for (Gallery gallery : category.getGalleries()) {
            galleryService.delete(gallery.getId());
        }

        categoryGalleryRepository.delete(category);
    }

    private CategoryGalleryResponse mapToResponse(CategoryGallery category) {
        CategoryGalleryResponse response = new CategoryGalleryResponse();
        response.setId(category.getId());
        response.setTitle(category.getTitle());
        return response;
    }
}