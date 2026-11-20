package taller.multimedia.backend.controller.child;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import taller.multimedia.backend.dto.child.ChildOptionResponse;
import taller.multimedia.backend.dto.child.ChildRequest;
import taller.multimedia.backend.dto.child.ChildResponse;
import taller.multimedia.backend.dto.child.ChildStatusFilter;
import taller.multimedia.backend.service.child.ChildService;
import taller.multimedia.backend.service.group.TeacherScopeService;

/**
 * Enrolled children. Teachers may read them; changes are for the owner and admins.
 */
@Validated
@RestController
@RequestMapping("/api/children")
@RequiredArgsConstructor
public class ChildController {

    private final ChildService childService;
    private final TeacherScopeService teacherScope;

    /**
     * {@code POST /api/children}
     *
     * @param request child data
     * @return 201 with the enrolled child
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ChildResponse> create(@Valid @RequestBody ChildRequest request) {
        ChildResponse created = childService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * {@code GET /api/children}
     *
     * @param pageable page, size and sort (first name by default)
     * @return active children
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN','TEACHER')")
    public ResponseEntity<Page<ChildResponse>> getAll(
            @PageableDefault(size = 10, sort = "firstName") Pageable pageable) {
        return ResponseEntity.ok(childService.getAll(pageable));
    }

    /**
     * {@code GET /api/children/admin}
     *
     * @param pageable page, size and sort
     * @param status active (default), inactive or all
     * @return the children with that status
     */
    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Page<ChildResponse>> getAllForAdmin(
            @PageableDefault(size = 10, sort = "firstName") Pageable pageable,
            @RequestParam(defaultValue = "ACTIVE") ChildStatusFilter status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(childService.getAll(pageable, status, search));
    }

    /**
     * {@code GET /api/children/available-for-expedient}
     *
     * @param authentication current user
     * @return children without a record; for a teacher, only those in their groups
     */
    @GetMapping("/available-for-expedient")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<ChildResponse>> getAvailableChildrenForExpedient(Authentication authentication) {
        List<ChildResponse> all = childService.getAvailableChildrenForExpedient();
        List<ChildResponse> children = teacherScope.visibleChildIds(authentication)
                .map(childIds -> all.stream().filter(child -> childIds.contains(child.getId())).toList())
                .orElse(all);
        return ResponseEntity.ok(children);
    }

    /**
     * {@code GET /api/children/parent/{parentId}}
     *
     * @param parentId parent ID
     * @param pageable page, size and sort
     * @return the parent's active children
     */
    @GetMapping("/parent/{parentId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN','TEACHER')")
    public ResponseEntity<Page<ChildResponse>> getByParent(
            @PathVariable Long parentId,
            @PageableDefault(size = 10, sort = "firstName") Pageable pageable) {
        return ResponseEntity.ok(childService.getByParentId(parentId, pageable));
    }

    /**
     * {@code GET /api/children/{id}}
     *
     * @param id child ID
     * @return the child
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN','TEACHER')")
    public ResponseEntity<ChildResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(childService.getById(id));
    }

    /**
     * {@code PUT /api/children/{id}}
     *
     * @param id child ID
     * @param request new data and clubs
     * @return the updated child
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ChildResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ChildRequest request) {
        return ResponseEntity.ok(childService.update(id, request));
    }

    /**
     * {@code DELETE /api/children/{id}}: deactivates the child and removes it from its clubs.
     *
     * @param id child ID
     * @return 204
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        childService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code GET /api/children/options}
     *
     * @return active children as options for a select field
     */
    @GetMapping("/options")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<List<ChildOptionResponse>> getChildrenOptions() {
        return ResponseEntity.ok(childService.getChildrenOptions());
    }
}
