package taller.multimedia.backend.controller.club;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.club.ClubRequest;
import taller.multimedia.backend.dto.club.ClubResponse;
import taller.multimedia.backend.service.club.ClubService;
import taller.multimedia.backend.service.spelling.SpellingCorrectionAsyncService;
import taller.multimedia.backend.util.ImageAltText;
import tools.jackson.databind.ObjectMapper;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Extracurricular clubs. Visitors may list them; changes are for the owner.
 */
@Validated
@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
public class ClubController {

    private final ClubService clubService;
    private final SpellingCorrectionAsyncService spellingCorrectionAsyncService;
    private final ObjectMapper objectMapper;

    /**
     * {@code POST /api/clubs} with JSON: creates a club and corrects its spelling in the
     * background.
     *
     * @param request club data
     * @return 201 with the created club
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ClubResponse> create(@Valid @RequestBody ClubRequest request) {
        ClubResponse createdClub = clubService.create(request);
        spellingCorrectionAsyncService.correctClub(createdClub.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdClub);
    }

    /**
     * {@code POST /api/clubs} with multipart: creates a club with its cover and content images.
     *
     * @param request club data, as form fields
     * @param coverImage cover image, optional
     * @param contentImages content images, optional
     * @param coverAlt alternative text of the cover, optional
     * @param contentAltsJson JSON array with the alternative text of each content image, optional
     * @return 201 with the created club
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ClubResponse> createWithImages(
            @Valid @ModelAttribute ClubRequest request,
            @RequestParam(name = "coverImage", required = false) MultipartFile coverImage,
            @RequestParam(name = "contentImages", required = false) List<MultipartFile> contentImages,
            @RequestParam(name = "coverAlt", required = false) String coverAlt,
            @RequestParam(name = "contentAlts", required = false) String contentAltsJson) {
        ClubResponse createdClub = clubService.createWithImages(request, coverImage, contentImages,
                coverAlt, ImageAltText.parseList(objectMapper, contentAltsJson));
        spellingCorrectionAsyncService.correctClub(createdClub.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdClub);
    }

    /**
     * {@code GET /api/clubs}
     *
     * @param lang requested language
     * @param pageable page, size and sort (name by default)
     * @return all clubs, published or not
     */
    @GetMapping
    public ResponseEntity<Page<ClubResponse>> getAll(
        @RequestParam (defaultValue = "es") String lang,
        @PageableDefault (size = 10, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(clubService.getAll(lang, pageable));
    }

    /**
     * {@code GET /api/clubs/available}
     *
     * @param lang requested language
     * @return published clubs with free spots
     */
    @GetMapping("/available")
    public ResponseEntity<List<ClubResponse>> getAvailableClubs(
            @RequestParam(defaultValue = "es") String lang) {
        return ResponseEntity.ok(clubService.getAvailableClubs(lang));
    }

    /**
     * {@code GET /api/clubs/{id}}
     *
     * @param id club ID
     * @param lang requested language
     * @return the club
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ClubResponse> getById(
            @PathVariable Long id,
            @RequestParam(defaultValue = "es") String lang) {
        return ResponseEntity.ok(clubService.getById(id, lang));
    }

    /**
     * {@code PUT /api/clubs/{id}}: updates a club and corrects its spelling again in the
     * background.
     *
     * @param id club ID
     * @param request new data
     * @return the updated club
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ClubResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ClubRequest request) {
        ClubResponse updatedClub = clubService.update(id, request);
        spellingCorrectionAsyncService.correctClub(updatedClub.getId());
        return ResponseEntity.ok(updatedClub);
    }

    /**
     * {@code DELETE /api/clubs/{id}}: deletes the club, its enrollments and its images.
     *
     * @param id club ID
     * @return 204
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        clubService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
