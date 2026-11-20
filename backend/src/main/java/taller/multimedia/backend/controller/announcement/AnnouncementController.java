package taller.multimedia.backend.controller.announcement;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import taller.multimedia.backend.dto.announcement.AnnouncementRequest;
import taller.multimedia.backend.dto.announcement.AnnouncementResponse;
import taller.multimedia.backend.service.announcement.AnnouncementService;
import taller.multimedia.backend.service.announcement.AnnouncementSummaryAsyncService;
import taller.multimedia.backend.service.spelling.SpellingCorrectionAsyncService;

import java.util.UUID;

/**
 * News and announcements. Reading is public; changes are for the owner and admins.
 */
@Validated
@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final AnnouncementSummaryAsyncService announcementSummaryAsyncService;
    private final SpellingCorrectionAsyncService spellingCorrectionAsyncService;

    /**
     * {@code POST /api/announcements}: creates an announcement, then corrects its spelling and
     * generates its AI summary in the background.
     *
     * @param request announcement data
     * @return 201 with the created announcement
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<AnnouncementResponse> create(@RequestBody @Valid AnnouncementRequest request) {

        AnnouncementResponse created = announcementService.create(request);
        spellingCorrectionAsyncService.correctAnnouncement(created.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * {@code GET /api/announcements}
     *
     * @param lang requested language, Spanish by default
     * @param page page number, from 0
     * @param size page size, 1 to 10
     * @param categoryId category to filter by, optional
     * @return announcements, newest first
     */
    @GetMapping
    public ResponseEntity<Page<AnnouncementResponse>> getAll(
            @RequestParam(name = "lang", defaultValue = "es") String lang, 
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(10) int size,
            @RequestParam(required = false) UUID categoryId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        Page<AnnouncementResponse> announcements = announcementService.getAll(lang, categoryId, pageable);
        return ResponseEntity.ok(announcements);
    }

    /**
     * {@code PUT /api/announcements/{id}}: updates an announcement and corrects its spelling again
     * in the background.
     *
     * @param id announcement ID
     * @param request new data
     * @return the updated announcement
     */
    @PutMapping(value = "/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<AnnouncementResponse> update( @PathVariable UUID id, @RequestBody @Valid AnnouncementRequest request) 
    {
        AnnouncementResponse updated = announcementService.update(id, request);
        spellingCorrectionAsyncService.correctAnnouncement(updated.getId());
        return ResponseEntity.ok(updated);
    }

    /**
     * {@code DELETE /api/announcements/{id}}: deletes the announcement and its images.
     *
     * @param id announcement ID
     * @return 204
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        announcementService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code POST /api/announcements/{id}/summary/regenerate}: generates the AI summary again in
     * the background, even if the content did not change.
     *
     * @param id announcement ID
     * @return 202
     */
    @PostMapping("/{id}/summary/regenerate")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> regenerateSummary(@PathVariable UUID id) {
        announcementSummaryAsyncService.generateSummaryAsync(id, true);
        return ResponseEntity.accepted().build();
    }
}