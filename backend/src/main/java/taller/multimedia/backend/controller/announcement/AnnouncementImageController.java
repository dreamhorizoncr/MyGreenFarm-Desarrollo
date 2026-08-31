package taller.multimedia.backend.controller.announcement;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import taller.multimedia.backend.dto.announcement.AnnouncementImageResponse;
import taller.multimedia.backend.service.announcement.AnnouncementImageService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementImageController {

    private final AnnouncementImageService imageService;

    @PostMapping(value = "/{announcementId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<List<AnnouncementImageResponse>> uploadImages(
            @PathVariable UUID announcementId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(name = "isCover", defaultValue = "false") boolean isCover) {

        List<AnnouncementImageResponse> responses = imageService.uploadImages(announcementId, files, isCover);
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @GetMapping("/{announcementId}/images")
    public ResponseEntity<List<AnnouncementImageResponse>> getImages(@PathVariable UUID announcementId) {
        List<AnnouncementImageResponse> images = imageService.getImagesByAnnouncement(announcementId);
        return ResponseEntity.ok(images);
    }

    @DeleteMapping("/images/{imageId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<Void> deleteImage(@PathVariable UUID imageId) {
        imageService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }
}