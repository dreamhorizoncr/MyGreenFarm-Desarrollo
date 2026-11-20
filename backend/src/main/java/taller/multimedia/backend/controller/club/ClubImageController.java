package taller.multimedia.backend.controller.club;

import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import taller.multimedia.backend.dto.common.ImageAltRequest;
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

/**
 * Images of clubs, managed by the owner and admins. Visitors see them inside the club responses.
 */
@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor 
public class ClubImageController {

    private final ClubImageService clubImageService;
    private final ObjectMapper objectMapper;

    /**
     * {@code POST /api/clubs/{clubId}/images}, multipart.
     *
     * @param clubId club ID
     * @param files images to upload
     * @param isCover {@code true} to upload the cover
     * @param altTextsJson JSON array with the alternative text of each file, optional
     * @return 201 with the saved images
     */
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

    /**
     * {@code GET /api/clubs/{clubId}/images}
     *
     * @param clubId club ID
     * @return the club's images in their gallery order
     */
    @GetMapping("/{clubId}/images")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<List<ClubImageResponse>> getImagesByClub(@PathVariable Long clubId) {
        return ResponseEntity.ok(clubImageService.getImagesByClub(clubId));
    }

    /**
     * {@code PUT /api/clubs/images/{imageId}}, multipart: replaces the file of an image.
     *
     * @param imageId image ID
     * @param file new image
     * @param isCover new role of the image, optional
     * @return the updated image
     */
    @PutMapping(value = "/images/{imageId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ClubImageResponse> updateImage(
            @PathVariable Long imageId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(name = "isCover", required = false) Boolean isCover) {

        return ResponseEntity.ok(clubImageService.updateImage(imageId, file, isCover));
    }

    /**
     * {@code PATCH /api/clubs/images/{imageId}/order}
     *
     * @param imageId image ID
     * @param sortOrder new position, zero or greater
     * @return the updated image
     */
    @PatchMapping("/images/{imageId}/order")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ClubImageResponse> updateSortOrder(
            @PathVariable Long imageId,
            @RequestParam("sortOrder") Integer sortOrder) {
        return ResponseEntity.ok(clubImageService.updateSortOrder(imageId, sortOrder));
    }

    /**
     * {@code PATCH /api/clubs/images/{imageId}/alt}
     *
     * @param imageId image ID
     * @param request new alternative text
     * @return 204
     */
    @PatchMapping("/images/{imageId}/alt")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> updateImageAlt(
            @PathVariable Long imageId,
            @Valid @RequestBody ImageAltRequest request) {
        clubImageService.updateAltText(imageId, request.getAltText());
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code DELETE /api/clubs/images/{imageId}}
     *
     * @param imageId image ID
     * @return 204
     */
    @DeleteMapping("/images/{imageId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> deleteImage(@PathVariable Long imageId) {
        clubImageService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code DELETE /api/clubs/{clubId}/images}
     *
     * @param clubId club ID
     * @return 204
     */
    @DeleteMapping("/{clubId}/images")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> deleteAllImagesByClub(@PathVariable Long clubId) {
        clubImageService.deleteAllImagesByClub(clubId);
        return ResponseEntity.noContent().build();
    }
}