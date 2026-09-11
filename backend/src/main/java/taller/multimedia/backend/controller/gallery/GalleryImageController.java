package taller.multimedia.backend.controller.gallery;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
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

    @GetMapping("/{galleryId}/images")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<GalleryImageResponse>> getImages(@PathVariable UUID galleryId) {
        List<GalleryImageResponse> images = imageService.getImagesByGallery(galleryId);
        return ResponseEntity.ok(images);
    }

    @DeleteMapping("/images/{imageId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> deleteImage(@PathVariable UUID imageId) {
        imageService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }
}