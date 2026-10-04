package taller.multimedia.backend.controller.club;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.club.ClubImageResponse;
import taller.multimedia.backend.service.club.ClubImageService;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor 
public class ClubImageController {

    private final ClubImageService clubImageService;

    @PostMapping(value = "/{clubId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<List<ClubImageResponse>> uploadImages(
            @PathVariable Long clubId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(name = "isCover", defaultValue = "false") boolean isCover) {

        List<ClubImageResponse> responses = clubImageService.uploadImages(clubId, files, isCover);
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @GetMapping("/{clubId}/images")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<List<ClubImageResponse>> getImagesByClub(@PathVariable Long clubId) {
        return ResponseEntity.ok(clubImageService.getImagesByClub(clubId));
    }

    @PutMapping(value = "/images/{imageId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ClubImageResponse> updateImage(
            @PathVariable Long imageId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(name = "isCover", required = false) Boolean isCover) {

        return ResponseEntity.ok(clubImageService.updateImage(imageId, file, isCover));
    }

    // Cambiar la posición / orden de una imagen específica
    @PatchMapping("/images/{imageId}/order")
    public ResponseEntity<ClubImageResponse> updateSortOrder(
            @PathVariable Long imageId,
            @RequestParam("sortOrder") Integer sortOrder) {
        return ResponseEntity.ok(clubImageService.updateSortOrder(imageId, sortOrder));
    }

    @DeleteMapping("/images/{imageId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> deleteImage(@PathVariable Long imageId) {
        clubImageService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{clubId}/images")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> deleteAllImagesByClub(@PathVariable Long clubId) {
        clubImageService.deleteAllImagesByClub(clubId);
        return ResponseEntity.noContent().build();
    }
}