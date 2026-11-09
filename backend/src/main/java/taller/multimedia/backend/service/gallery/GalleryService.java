package taller.multimedia.backend.service.gallery;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
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

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GalleryService {

    private static final int IMAGES_PER_GALLERY = 10;

    private final GalleryImageService galleryImageService;
    private final GalleryRepository galleryRepository;
    private final CategoryGalleryRepository categoryGalleryRepository;

    @Transactional
    public GalleryResponse create(GalleryRequest dto) {
        CategoryGallery category = categoryGalleryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + dto.getCategoryId()));

        Gallery gallery = new Gallery();
        gallery.setCategoryGallery(category);
        gallery.setTitle(Sanitizer.requireClean("title", dto.getTitle()));
        gallery.setDescription(Sanitizer.requireClean("description", dto.getDescription()));

        Gallery saved = galleryRepository.save(gallery);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<GalleryResponse> getAll(Pageable pageable) {
        return withImages(galleryRepository.findAllByOrderByCreatedAtDesc(pageable));
    }

    @Transactional(readOnly = true)
    public Page<GalleryResponse> getByCategory(UUID categoryId, Pageable pageable) {
        return withImages(galleryRepository.findByCategoryGalleryIdOrderByCreatedAtDesc(categoryId, pageable));
    }

    @Transactional(readOnly = true)
    public GalleryResponse getById(UUID id) {
        return galleryRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Gallery not found with ID: " + id));
    }

    @Transactional
    public GalleryResponse update(UUID id, GalleryRequest dto) {
        Gallery gallery = galleryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gallery not found with ID: " + id));

        CategoryGallery category = categoryGalleryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + dto.getCategoryId()));

        if (Boolean.TRUE.equals(dto.getFeatured()) && !Boolean.TRUE.equals(gallery.getFeatured())) {
            long currentFeaturedCount = galleryRepository.countByFeaturedTrue();
            if (currentFeaturedCount >= 3) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "There are already 3 featured galleries. Unfeature one before featuring another.");
            }
        }

        gallery.setCategoryGallery(category);
        gallery.setTitle(Sanitizer.requireClean("title", dto.getTitle()));
        gallery.setDescription(Sanitizer.requireClean("description", dto.getDescription()));
        gallery.setFeatured(dto.getFeatured() != null ? dto.getFeatured() : false);

        Gallery updated = galleryRepository.save(gallery);
        return mapToResponse(updated);
    }

    @Transactional
public void delete(UUID id) {
    Gallery gallery = galleryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Gallery not found with ID: " + id));

     List<String> filePaths = galleryImageService.getFilePaths(gallery.getGalleryImages());

    galleryRepository.delete(gallery);
    galleryRepository.flush(); // fail here on a blocking FK, before touching the bucket

    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
        @Override
        public void afterCommit() {
            galleryImageService.deleteFiles(filePaths);
        }
    });
}

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