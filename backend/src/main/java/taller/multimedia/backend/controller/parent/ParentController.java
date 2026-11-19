package taller.multimedia.backend.controller.parent;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.validation.annotation.Validated;
import taller.multimedia.backend.dto.parent.ParentRequest;
import taller.multimedia.backend.model.parent.Parent;
import taller.multimedia.backend.service.parent.ParentService;

/**
 * Parents and guardians, managed by the owner and admins.
 */
@Validated
@RestController
@RequestMapping("/api/parents")
public class ParentController {

    private final ParentService parentService;

    public ParentController(ParentService parentService) {
        this.parentService = parentService;
    }

    /**
     * {@code POST /api/parents}
     *
     * @param request parent data
     * @return 201 with the created parent, or 400 with the reason
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> createParent(@Valid @RequestBody ParentRequest request) {
        try {
            Parent savedParent = parentService.createParent(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedParent);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    /**
     * {@code GET /api/parents}
     *
     * @param lang requested language; not used
     * @param pageable page, size and sort (last name by default)
     * @return active parents
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Page<Parent>> getAllParents(
        @RequestParam (defaultValue = "es") String lang,
        @RequestParam(required = false) String search,
        @PageableDefault (size = 10, sort = "lastName") Pageable pageable) {
        Page<Parent> parents = parentService.getAllParents(pageable, search);
        return ResponseEntity.ok(parents);
    }

    /**
     * {@code GET /api/parents/{id}}
     *
     * @param id parent ID
     * @return the parent, or 404
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> getParentById(@PathVariable Integer id) {
        try {
            Parent parent = parentService.getParentById(id);
            return ResponseEntity.ok(parent);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    /**
     * {@code PUT /api/parents/{id}}
     *
     * @param id parent ID
     * @param request new data
     * @return the updated parent, or 400 with the reason
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> updateParent(@PathVariable Integer id, @Valid @RequestBody ParentRequest request) {
        try {
            Parent updated = parentService.updateParent(id, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    /**
     * {@code DELETE /api/parents/newsletter-subscription}, owner only: the parent stops receiving
     * the newsletter.
     *
     * @param email parent's email
     * @return a confirmation, or 404
     */
    @DeleteMapping("/newsletter-subscription")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<String> unsubscribeFromNewsletter(@RequestParam String email) {
        try {
            parentService.unsubscribeFromNewsletter(email);
            return ResponseEntity.ok("The parent will no longer receive newsletter emails.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    /**
     * {@code DELETE /api/parents/{id}}: deactivates the parent and their children.
     *
     * @param id parent ID
     * @return a confirmation, or 404
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<String> deleteParent(@PathVariable Integer id) {
        try {
            parentService.deleteParent(id);
            return ResponseEntity.ok("Parent deleted successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}
