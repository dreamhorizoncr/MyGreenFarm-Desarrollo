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

@Validated
@RestController
@RequestMapping("/api/parents")
public class ParentController {

    private final ParentService parentService;

    public ParentController(ParentService parentService) {
        this.parentService = parentService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> createParent(@Valid @RequestBody ParentRequest dto) {
        try {
            Parent savedParent = parentService.createParent(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedParent);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Page<Parent>> getAllParents(
        @RequestParam (defaultValue = "es") String lang,
        @PageableDefault (size = 10, sort = "lastName") Pageable pageable) {
        Page<Parent> parents = parentService.getAllParents(pageable);
        return ResponseEntity.ok(parents);
    }

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

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> updateParent(@PathVariable Integer id, @Valid @RequestBody ParentRequest dto) {
        try {
            Parent updated = parentService.updateParent(id, dto);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

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
