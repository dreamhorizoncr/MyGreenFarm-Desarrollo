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
import taller.multimedia.backend.security.services.UserDetailsImpl;
import taller.multimedia.backend.service.group.GroupService;

@Validated
@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<GroupResponse> create(@Valid @RequestBody GroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.create(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'TEACHER')")
    public ResponseEntity<List<GroupResponse>> getAll(Authentication authentication) {
        if (isOwner(authentication)) {
            return ResponseEntity.ok(groupService.getAll());
        }

        UserDetailsImpl currentUser = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(groupService.getByTeacher(currentUser.getId()));
    }

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

    @GetMapping("/teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('OWNER', 'TEACHER')")
    public ResponseEntity<List<GroupResponse>> getByTeacher(
            @PathVariable UUID teacherId,
            Authentication authentication) {
        if (!isOwner(authentication)) {
            UserDetailsImpl currentUser = (UserDetailsImpl) authentication.getPrincipal();
            if (!currentUser.getId().equals(teacherId)) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "No puede consultar los grupos de otro teacher");
            }
        }

        return ResponseEntity.ok(groupService.getByTeacher(teacherId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<GroupResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody GroupRequest request) {
        return ResponseEntity.ok(groupService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        groupService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{groupId}/children/{childId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<GroupResponse> addChild(
            @PathVariable Long groupId,
            @PathVariable Long childId) {
        return ResponseEntity.ok(groupService.addChild(groupId, childId));
    }

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
