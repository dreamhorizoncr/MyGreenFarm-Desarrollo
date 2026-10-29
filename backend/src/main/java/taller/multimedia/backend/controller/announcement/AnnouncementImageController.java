package taller.multimedia.backend.controller.announcement;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import taller.multimedia.backend.dto.ImageAltRequest;
import taller.multimedia.backend.util.ImageAltText;
import tools.jackson.databind.ObjectMapper;
import taller.multimedia.backend.dto.announcement.AnnouncementImageResponse;
import taller.multimedia.backend.service.announcement.AnnouncementImageService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementImageController {

    private final AnnouncementImageService imageService;
    private final ObjectMapper objectMapper;

    @PostMapping(value = "/{announcementId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<List<AnnouncementImageResponse>> uploadImages(
            @PathVariable UUID announcementId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(name = "isCover", defaultValue = "false") boolean isCover,
            @RequestParam(name = "altTexts", required = false) String altTextsJson) {

        List<AnnouncementImageResponse> responses = imageService.uploadImages(
                announcementId, files, isCover, ImageAltText.parseList(objectMapper, altTextsJson));
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @GetMapping("/{announcementId}/images")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<AnnouncementImageResponse>> getImages(@PathVariable UUID announcementId) {
        List<AnnouncementImageResponse> images = imageService.getImagesByAnnouncement(announcementId);
        return ResponseEntity.ok(images);
    }

    @PatchMapping("/images/{imageId}/alt")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> updateImageAlt(
            @PathVariable UUID imageId,
            @Valid @RequestBody ImageAltRequest request) {
        imageService.updateAltText(imageId, request.getAltText());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/images/{imageId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> deleteImage(@PathVariable UUID imageId) {
        imageService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }
}