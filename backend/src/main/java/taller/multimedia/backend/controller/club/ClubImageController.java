package taller.multimedia.backend.controller.club;

import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import taller.multimedia.backend.dto.ImageAltRequest;
import taller.multimedia.backend.util.ImageAltText;
import tools.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper;

    @PostMapping(value = "/{clubId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<List<ClubImageResponse>> uploadImages(
            @PathVariable Long clubId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(name = "isCover", defaultValue = "false") boolean isCover,
            @RequestParam(name = "altTexts", required = false) String altTextsJson) {

        List<ClubImageResponse> responses = clubImageService.uploadImages(
                clubId, files, isCover, ImageAltText.parseList(objectMapper, altTextsJson));
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

    @PatchMapping("/images/{imageId}/order")
    public ResponseEntity<ClubImageResponse> updateSortOrder(
            @PathVariable Long imageId,
            @RequestParam("sortOrder") Integer sortOrder) {
        return ResponseEntity.ok(clubImageService.updateSortOrder(imageId, sortOrder));
    }

    // Edita solo el texto alternativo de una imagen ya subida
    @PatchMapping("/images/{imageId}/alt")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> updateImageAlt(
            @PathVariable Long imageId,
            @Valid @RequestBody ImageAltRequest request) {
        clubImageService.updateAltText(imageId, request.getAltText());
        return ResponseEntity.noContent().build();
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