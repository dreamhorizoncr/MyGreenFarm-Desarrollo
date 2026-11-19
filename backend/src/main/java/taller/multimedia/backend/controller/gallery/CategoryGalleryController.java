package taller.multimedia.backend.controller.gallery;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import taller.multimedia.backend.dto.gallery.CategoryGalleryRequest;
import taller.multimedia.backend.dto.gallery.CategoryGalleryResponse;
import taller.multimedia.backend.service.gallery.CategoryGalleryService;

import java.util.List;
import java.util.UUID;

/**
 * Gallery categories. Reading is public; changes are for the owner and admins.
 */
@RestController
@RequestMapping("/api/gallery/categories")
@RequiredArgsConstructor
public class CategoryGalleryController {

    private final CategoryGalleryService categoryGalleryService;

    /**
     * {@code POST /api/gallery/categories}
     *
     * @param request category title
     * @return 201 with the created category
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<CategoryGalleryResponse> create(@RequestBody @Valid CategoryGalleryRequest request) {
        CategoryGalleryResponse created = categoryGalleryService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * {@code GET /api/gallery/categories}
     *
     * @return all categories
     */
    @GetMapping
    public ResponseEntity<List<CategoryGalleryResponse>> getAll() {
        return ResponseEntity.ok(categoryGalleryService.getAll());
    }

    /**
     * {@code GET /api/gallery/categories/{id}}
     *
     * @param id category ID
     * @return the category
     */
    @GetMapping("/{id}")
    public ResponseEntity<CategoryGalleryResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(categoryGalleryService.getById(id));
    }

    /**
     * {@code PUT /api/gallery/categories/{id}}
     *
     * @param id category ID
     * @param request new title
     * @return the updated category
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<CategoryGalleryResponse> update(@PathVariable UUID id, @RequestBody @Valid CategoryGalleryRequest request) {
        return ResponseEntity.ok(categoryGalleryService.update(id, request));
    }

    /**
     * {@code DELETE /api/gallery/categories/{id}}: deletes the category with its galleries and
     * images.
     *
     * @param id category ID
     * @return 204
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        categoryGalleryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}