package taller.multimedia.backend.controller.group;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.group.GroupRequest;
import taller.multimedia.backend.dto.group.GroupResponse;
import taller.multimedia.backend.security.service.UserDetailsImpl;
import taller.multimedia.backend.service.group.GroupService;

/**
 * Class groups. The owner manages them; a teacher may only see the groups they are assigned to.
 */
@Validated
@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    /**
     * {@code POST /api/groups}
     *
     * @param request group data, teachers and children
     * @return 201 with the created group
     */
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<GroupResponse> create(@Valid @RequestBody GroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.create(request));
    }

    /**
     * {@code GET /api/groups}
     *
     * @param authentication current user
     * @return every group for the owner, or the teacher's own groups
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'TEACHER')")
    public ResponseEntity<List<GroupResponse>> getAll(Authentication authentication) {
        if (isOwner(authentication)) {
            return ResponseEntity.ok(groupService.getAll());
        }

        UserDetailsImpl currentUser = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(groupService.getByTeacher(currentUser.getId()));
    }

    /**
     * {@code GET /api/groups/{id}}
     *
     * @param id group ID
     * @param authentication current user
     * @return the group; a teacher gets 403 if not assigned to it
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'TEACHER')")
    public ResponseEntity<GroupResponse> getById(
            @PathVariable Long id,
            Authentication authentication) {
        if (isOwner(authentication)) {
            return ResponseEntity.ok(groupService.getById(id));
        }

        UserDetailsImpl currentUser = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(groupService.getByIdForTeacher(id, currentUser.getId()));
    }

    /**
     * {@code GET /api/groups/teacher/{teacherId}}
     *
     * @param teacherId teacher ID
     * @param authentication current user
     * @return the teacher's groups; a teacher may only ask for their own
     */
    @GetMapping("/teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('OWNER', 'TEACHER')")
    public ResponseEntity<List<GroupResponse>> getByTeacher(
            @PathVariable UUID teacherId,
            Authentication authentication) {
        if (!isOwner(authentication)) {
            UserDetailsImpl currentUser = (UserDetailsImpl) authentication.getPrincipal();
            if (!currentUser.getId().equals(teacherId)) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "You cannot view another teacher's groups");
            }
        }

        return ResponseEntity.ok(groupService.getByTeacher(teacherId));
    }

    /**
     * {@code PUT /api/groups/{id}}
     *
     * @param id group ID
     * @param request new data
     * @return the updated group
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<GroupResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody GroupRequest request) {
        return ResponseEntity.ok(groupService.update(id, request));
    }

    /**
     * {@code DELETE /api/groups/{id}}
     *
     * @param id group ID
     * @return 204
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        groupService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code POST /api/groups/{groupId}/children/{childId}}
     *
     * @param groupId group ID
     * @param childId child to add
     * @return the updated group
     */
    @PostMapping("/{groupId}/children/{childId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<GroupResponse> addChild(
            @PathVariable Long groupId,
            @PathVariable Long childId) {
        return ResponseEntity.ok(groupService.addChild(groupId, childId));
    }

    /**
     * {@code DELETE /api/groups/{groupId}/children/{childId}}
     *
     * @param groupId group ID
     * @param childId child to remove
     * @return the updated group
     */
    @DeleteMapping("/{groupId}/children/{childId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<GroupResponse> removeChild(
            @PathVariable Long groupId,
            @PathVariable Long childId) {
        return ResponseEntity.ok(groupService.removeChild(groupId, childId));
    }

    private boolean isOwner(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_OWNER"));
    }
}
