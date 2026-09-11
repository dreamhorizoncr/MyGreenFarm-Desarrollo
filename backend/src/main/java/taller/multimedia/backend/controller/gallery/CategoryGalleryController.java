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

@RestController
@RequestMapping("/api/gallery/categories")
@RequiredArgsConstructor
public class CategoryGalleryController {

    private final CategoryGalleryService categoryGalleryService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<CategoryGalleryResponse> create(@RequestBody @Valid CategoryGalleryRequest dto) {
        CategoryGalleryResponse created = categoryGalleryService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<CategoryGalleryResponse>> getAll() {
        return ResponseEntity.ok(categoryGalleryService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryGalleryResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(categoryGalleryService.getById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<CategoryGalleryResponse> update(@PathVariable UUID id, @RequestBody @Valid CategoryGalleryRequest dto) {
        return ResponseEntity.ok(categoryGalleryService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        categoryGalleryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}