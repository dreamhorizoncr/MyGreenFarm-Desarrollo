package taller.multimedia.backend.controller.gallery;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import taller.multimedia.backend.dto.gallery.GalleryRequest;
import taller.multimedia.backend.dto.gallery.GalleryResponse;
import taller.multimedia.backend.service.gallery.GalleryService;

import java.util.List;
import java.util.UUID;

/**
 * Photo galleries. Reading is public; changes are for the owner and admins.
 */
@Validated
@RestController
@RequestMapping("/api/gallery")
@RequiredArgsConstructor
public class GalleryController {

    private final GalleryService galleryService;

    /**
     * {@code POST /api/gallery}
     *
     * @param request category, title and description
     * @return 201 with the created gallery
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<GalleryResponse> create(@RequestBody @Valid GalleryRequest request) {
        GalleryResponse created = galleryService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * {@code GET /api/gallery}
     *
     * @param categoryId category to filter by, optional
     * @param page page number, from 0
     * @param size page size, 1 to 10
     * @return galleries, newest first, with their first images
     */
    @GetMapping
    public ResponseEntity<Page<GalleryResponse>> getAll(
            @RequestParam(name = "categoryId", required = false) UUID categoryId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(10) int size) {
            
            Pageable pageable = PageRequest.of(page, size);
                Page<GalleryResponse> galleries = categoryId != null
                ? galleryService.getByCategory(categoryId, pageable)
                : galleryService.getAll(pageable);
        return ResponseEntity.ok(galleries);
    }

    /**
     * {@code GET /api/gallery/{id}}
     *
     * @param id gallery ID
     * @return the gallery
     */
    @GetMapping("/{id}")
    public ResponseEntity<GalleryResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(galleryService.getById(id));
    }

    /**
     * {@code GET /api/gallery/featured}
     *
     * @return the galleries featured on the home page
     */
    @GetMapping("/featured")
    public ResponseEntity<List<GalleryResponse>> getFeaturedGalleries() {
        return ResponseEntity.ok(galleryService.getFeaturedGalleries());
    }

    /**
     * {@code PUT /api/gallery/{id}}
     *
     * @param id gallery ID
     * @param request new data and featured flag
     * @return the updated gallery
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<GalleryResponse> update(@PathVariable UUID id, @RequestBody @Valid GalleryRequest request) {
        return ResponseEntity.ok(galleryService.update(id, request));
    }

    /**
     * {@code DELETE /api/gallery/{id}}: deletes the gallery and its images.
     *
     * @param id gallery ID
     * @return 204
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        galleryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}