package taller.multimedia.backend.controller.gallery;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import taller.multimedia.backend.dto.gallery.GalleryImageResponse;
import taller.multimedia.backend.service.gallery.GalleryImageService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/gallery")
@RequiredArgsConstructor
public class GalleryImageController {

    private final GalleryImageService imageService;

    @PostMapping(value = "/{galleryId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<List<GalleryImageResponse>> uploadImages(
            @PathVariable UUID galleryId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("title") String title) {

        List<GalleryImageResponse> responses = imageService.uploadImages(galleryId, files, title);
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @Validated
    @GetMapping("/{galleryId}/images")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Page<GalleryImageResponse>> getImages(@PathVariable UUID galleryId,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "10") @Min(1) @Max(10) int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<GalleryImageResponse> images = imageService.getImagesByGallery(galleryId, pageable);
        return ResponseEntity.ok(images);
    }

    @DeleteMapping("/images/{imageId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> deleteImage(@PathVariable UUID imageId) {
        imageService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }
}