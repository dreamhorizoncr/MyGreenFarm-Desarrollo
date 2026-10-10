package taller.multimedia.backend.controller.club;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.club.ClubRequest;
import taller.multimedia.backend.dto.club.ClubResponse;
import taller.multimedia.backend.service.club.ClubService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
public class ClubController {

    private final ClubService clubService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ClubResponse> create(@Valid @RequestBody ClubRequest request) {
        ClubResponse createdClub = clubService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdClub);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ClubResponse> createWithImages(
            @Valid @ModelAttribute ClubRequest request,
            @RequestParam(name = "coverImage", required = false) MultipartFile coverImage,
            @RequestParam(name = "contentImages", required = false) List<MultipartFile> contentImages) {
        ClubResponse createdClub = clubService.createWithImages(request, coverImage, contentImages);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdClub);
    }

    @GetMapping
    public ResponseEntity<Page<ClubResponse>> getAll(
            @RequestParam(defaultValue = "es") String lang,
            @PageableDefault(size = 10, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(clubService.getAll(lang, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ClubResponse> getById(
            @PathVariable Long id,
            @RequestParam(defaultValue = "es") String lang) {
        return ResponseEntity.ok(clubService.getById(id, lang));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ClubResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ClubRequest request) {
        return ResponseEntity.ok(clubService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        clubService.delete(id);
        return ResponseEntity.noContent().build();
    }
}