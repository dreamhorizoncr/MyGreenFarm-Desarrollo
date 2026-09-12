package taller.multimedia.backend.controller.gallery;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import taller.multimedia.backend.dto.gallery.GalleryRequest;
import taller.multimedia.backend.dto.gallery.GalleryResponse;
import taller.multimedia.backend.service.gallery.GalleryService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/gallery")
@RequiredArgsConstructor
public class GalleryController {

    private final GalleryService galleryService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<GalleryResponse> create(@RequestBody @Valid GalleryRequest dto) {
        GalleryResponse created = galleryService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<GalleryResponse>> getAll(
            @RequestParam(name = "categoryId", required = false) UUID categoryId) {
        List<GalleryResponse> galleries = categoryId != null
                ? galleryService.getByCategory(categoryId)
                : galleryService.getAll();
        return ResponseEntity.ok(galleries);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GalleryResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(galleryService.getById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<GalleryResponse> update(@PathVariable UUID id, @RequestBody @Valid GalleryRequest dto) {
        return ResponseEntity.ok(galleryService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        galleryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}