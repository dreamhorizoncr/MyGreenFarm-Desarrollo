package taller.multimedia.backend.controller.announcement;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.announcement.AnnouncementCategoryRequest;
import taller.multimedia.backend.dto.announcement.AnnouncementCategoryResponse;
import taller.multimedia.backend.service.announcement.AnnouncementCategoryService;

/**
 * Announcement categories. Reading is public; changes are for the owner and admins.
 */
@RestController
@RequestMapping("/api/announcements/categories")
@RequiredArgsConstructor
public class AnnouncementCategoryController {

    private final AnnouncementCategoryService categoryService;

    /**
     * {@code GET /api/announcements/categories}
     *
     * @return the categories in their display order
     */
    @GetMapping
    public ResponseEntity<List<AnnouncementCategoryResponse>> getAll() {
        return ResponseEntity.ok(categoryService.getAll());
    }

    /**
     * {@code POST /api/announcements/categories}
     *
     * @param request category title
     * @return 201 with the created category
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<AnnouncementCategoryResponse> create(@RequestBody @Valid AnnouncementCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(request));
    }

    /**
     * {@code DELETE /api/announcements/categories/{id}}: deletes the category and all its
     * announcements.
     *
     * @param id category ID
     * @return 204
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
