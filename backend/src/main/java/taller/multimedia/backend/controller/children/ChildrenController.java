package taller.multimedia.backend.controller.children;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import taller.multimedia.backend.dto.children.ChildrenRequest;
import taller.multimedia.backend.dto.children.ChildrenResponse;
import taller.multimedia.backend.service.children.ChildrenService;

@RestController
@RequestMapping("/api/children")
@RequiredArgsConstructor
public class ChildrenController {

    private final ChildrenService childrenService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ChildrenResponse> create(@Valid @RequestBody ChildrenRequest request) {
        ChildrenResponse created = childrenService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN','TEACHER')")
    public ResponseEntity<Page<ChildrenResponse>> getAll(
            @PageableDefault(size = 10, sort = "firstName") Pageable pageable) {
        return ResponseEntity.ok(childrenService.getAll(pageable));
    }

    @GetMapping("/parent/{parentId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN','TEACHER')")
    public ResponseEntity<Page<ChildrenResponse>> getByParent(
            @PathVariable Long parentId,
            @PageableDefault(size = 10, sort = "firstName") Pageable pageable) {
        return ResponseEntity.ok(childrenService.getByParentId(parentId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN','TEACHER')")
    public ResponseEntity<ChildrenResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(childrenService.getById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ChildrenResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ChildrenRequest request) {
        return ResponseEntity.ok(childrenService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        childrenService.delete(id);
        return ResponseEntity.noContent().build();
    }
}