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
import jakarta.validation.Valid;
import taller.multimedia.backend.dto.common.ImageAltRequest;
import taller.multimedia.backend.util.ImageAltText;
import tools.jackson.databind.ObjectMapper;
import taller.multimedia.backend.dto.gallery.GalleryImageResponse;
import taller.multimedia.backend.service.gallery.GalleryImageService;

import java.util.List;
import java.util.UUID;

/**
 * Images of the photo galleries. Reading is public; changes are for the owner and admins.
 */
@RestController
@RequestMapping("/api/gallery")
@RequiredArgsConstructor
public class GalleryImageController {

    private final GalleryImageService imageService;
    private final ObjectMapper objectMapper;

    /**
     * {@code POST /api/gallery/{galleryId}/images}, multipart.
     *
     * @param galleryId gallery ID
     * @param files images to upload
     * @param title title shared by the images
     * @param altTextsJson JSON array with the alternative text of each file, optional
     * @return 201 with the saved images
     */
    @PostMapping(value = "/{galleryId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<List<GalleryImageResponse>> uploadImages(
            @PathVariable UUID galleryId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("title") String title,
            @RequestParam(name = "altTexts", required = false) String altTextsJson) {

        List<GalleryImageResponse> responses = imageService.uploadImages(
                galleryId, files, title, ImageAltText.parseList(objectMapper, altTextsJson));
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    /**
     * {@code GET /api/gallery/{galleryId}/images}
     *
     * @param galleryId gallery ID
     * @param page page number, from 0
     * @param size page size, 1 to 10
     * @return the gallery's images, newest first, with their likes
     */
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

    /**
     * {@code GET /api/gallery/images/most-liked}
     *
     * @param limit number of images, 1 to 20
     * @return the most liked images
     */
    @Validated
    @GetMapping("/images/most-liked")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<GalleryImageResponse>> getMostLiked(
        @RequestParam(defaultValue = "10") @Min(1) @Max(20) int limit) {
        return ResponseEntity.ok(imageService.getMostLiked(limit));
    }

    /**
     * {@code PATCH /api/gallery/images/{imageId}/alt}
     *
     * @param imageId image ID
     * @param request new alternative text
     * @return 204
     */
    @PatchMapping("/images/{imageId}/alt")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> updateImageAlt(
            @PathVariable UUID imageId,
            @Valid @RequestBody ImageAltRequest request) {
        imageService.updateAltText(imageId, request.getAltText());
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code DELETE /api/gallery/images/{imageId}}
     *
     * @param imageId image ID
     * @return 204
     */
    @DeleteMapping("/images/{imageId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> deleteImage(@PathVariable UUID imageId) {
        imageService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }
}