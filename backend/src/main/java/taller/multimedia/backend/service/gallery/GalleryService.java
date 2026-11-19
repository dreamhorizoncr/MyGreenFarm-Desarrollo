package taller.multimedia.backend.service.gallery;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
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
import taller.multimedia.backend.util.Sanitizer;
import taller.multimedia.backend.util.AfterCommit;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Photo galleries. Each gallery belongs to a category, and lists return at most {@code
 * IMAGES_PER_GALLERY} images per gallery so pages stay light.
 */
@Service
@RequiredArgsConstructor
public class GalleryService {

    private static final int IMAGES_PER_GALLERY = 10;

    private final GalleryImageService galleryImageService;
    private final GalleryRepository galleryRepository;
    private final CategoryGalleryRepository categoryGalleryRepository;

    /**
     * @param request category, title and description (sanitized)
     * @return the created gallery
     * @throws RuntimeException if the category does not exist
     * @throws taller.multimedia.backend.exception.InvalidFieldException if the title or description is unsafe
     */
    @Transactional
    public GalleryResponse create(GalleryRequest request) {
        CategoryGallery category = categoryGalleryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + request.getCategoryId()));

        Gallery gallery = new Gallery();
        gallery.setCategoryGallery(category);
        gallery.setTitle(Sanitizer.requireClean("title", request.getTitle()));
        gallery.setDescription(Sanitizer.requireClean("description", request.getDescription()));

        Gallery saved = galleryRepository.save(gallery);
        return mapToResponse(saved);
    }

    /**
     * @param pageable page to return
     * @return galleries, newest first, with their first images
     */
    @Transactional(readOnly = true)
    public Page<GalleryResponse> getAll(Pageable pageable) {
        return withImages(galleryRepository.findAllByOrderByCreatedAtDesc(pageable));
    }

    /**
     * @param categoryId gallery category
     * @param pageable page to return
     * @return the category's galleries, newest first, with their first images
     */
    @Transactional(readOnly = true)
    public Page<GalleryResponse> getByCategory(UUID categoryId, Pageable pageable) {
        return withImages(galleryRepository.findByCategoryGalleryIdOrderByCreatedAtDesc(categoryId, pageable));
    }

    /**
     * @param id gallery ID
     * @return the gallery with its first images
     * @throws RuntimeException if it does not exist
     */
    @Transactional(readOnly = true)
    public GalleryResponse getById(UUID id) {
        return galleryRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Gallery not found with ID: " + id));
    }

    /**
     * Updates a gallery. At most three galleries can be featured on the home page at the same time.
     *
     * @param id gallery ID
     * @param request new category, title, description and featured flag
     * @return the updated gallery
     * @throws RuntimeException if the gallery or category does not exist
     * @throws ResponseStatusException with 409 if featuring it would exceed three featured
     *     galleries
     */
    @Transactional
    public GalleryResponse update(UUID id, GalleryRequest request) {
        Gallery gallery = galleryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gallery not found with ID: " + id));

        CategoryGallery category = categoryGalleryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + request.getCategoryId()));

        if (Boolean.TRUE.equals(request.getFeatured()) && !Boolean.TRUE.equals(gallery.getFeatured())) {
            long currentFeaturedCount = galleryRepository.countByFeaturedTrue();
            if (currentFeaturedCount >= 3) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "There are already 3 featured galleries. Unfeature one before featuring another.");
            }
        }

        gallery.setCategoryGallery(category);
        gallery.setTitle(Sanitizer.requireClean("title", request.getTitle()));
        gallery.setDescription(Sanitizer.requireClean("description", request.getDescription()));
        gallery.setFeatured(request.getFeatured() != null ? request.getFeatured() : false);

        Gallery updated = galleryRepository.save(gallery);
        return mapToResponse(updated);
    }

/**
 * Deletes a gallery and its images. The image files are removed from storage only after the
 * transaction commits, so a failed delete never leaves the gallery without its files.
 *
 * @param id gallery ID
 * @throws RuntimeException if the gallery does not exist
 */
    @Transactional
public void delete(UUID id) {
    Gallery gallery = galleryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Gallery not found with ID: " + id));

     List<String> filePaths = galleryImageService.getFilePaths(gallery.getGalleryImages());

    galleryRepository.delete(gallery);
    galleryRepository.flush(); // fail here on a blocking FK, before touching the bucket

    AfterCommit.run(() -> galleryImageService.deleteFiles(filePaths));
}

    /**
     * @return the galleries featured on the home page, with their first images
     */
    @Transactional(readOnly = true)
    public List<GalleryResponse> getFeaturedGalleries() {
        List<Gallery> featured = galleryRepository.findByFeaturedTrue();
        Map<UUID, List<GalleryImageResponse>> images =
                galleryImageService.getImagesByGalleries(featured.stream().map(Gallery::getId).toList(), IMAGES_PER_GALLERY);
        return featured.stream().map(gallery -> mapToResponse(gallery, images)).toList();
    }

    private Page<GalleryResponse> withImages(Page<Gallery> galleries) {
        Map<UUID, List<GalleryImageResponse>> images = galleryImageService.getImagesByGalleries(
                galleries.getContent().stream().map(Gallery::getId).toList(), IMAGES_PER_GALLERY);
        return galleries.map(gallery -> mapToResponse(gallery, images));
    }

    private GalleryResponse mapToResponse(Gallery gallery) {
        return mapToResponse(gallery, galleryImageService.getImagesByGalleries(List.of(gallery.getId()), IMAGES_PER_GALLERY));
    }

    private GalleryResponse mapToResponse(Gallery gallery, Map<UUID, List<GalleryImageResponse>> images) {
        GalleryResponse response = new GalleryResponse();
        response.setId(gallery.getId());
        response.setTitle(gallery.getTitle());
        response.setDescription(gallery.getDescription());
        response.setFeatured(gallery.getFeatured());
        response.setGalleryImages(images.getOrDefault(gallery.getId(), List.of()).toArray(new GalleryImageResponse[0]));
        return response;
    }

}