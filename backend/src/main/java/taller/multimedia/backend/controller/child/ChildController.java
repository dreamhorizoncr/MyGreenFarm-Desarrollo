package taller.multimedia.backend.controller.child;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import taller.multimedia.backend.dto.child.ChildRequest;
import taller.multimedia.backend.dto.child.ChildResponse;
import taller.multimedia.backend.service.child.ChildService;

@RestController
@RequestMapping("/api/child")
@RequiredArgsConstructor
public class ChildController {

    private final ChildService childService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ChildResponse> create(@Valid @RequestBody ChildRequest request) {
        ChildResponse created = childService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN','TEACHER')")
    public ResponseEntity<Page<ChildResponse>> getAll(
            @PageableDefault(size = 10, sort = "firstName") Pageable pageable) {
        return ResponseEntity.ok(childService.getAll(pageable));
    }

    @GetMapping("/parent/{parentId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN','TEACHER')")
    public ResponseEntity<Page<ChildResponse>> getByParent(
            @PathVariable Long parentId,
            @PageableDefault(size = 10, sort = "firstName") Pageable pageable) {
        return ResponseEntity.ok(childService.getByParentId(parentId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN','TEACHER')")
    public ResponseEntity<ChildResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(childService.getById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ChildResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ChildRequest request) {
        return ResponseEntity.ok(childService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        childService.delete(id);
        return ResponseEntity.noContent().build();
    }
}