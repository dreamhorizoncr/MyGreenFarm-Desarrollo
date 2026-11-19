package taller.multimedia.backend.controller.user;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import taller.multimedia.backend.dto.common.MessageResponse;
import taller.multimedia.backend.dto.user.UpdateUserRequest;
import taller.multimedia.backend.dto.user.PublicTeacherResponse;
import taller.multimedia.backend.dto.user.UserInfoResponse;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.service.user.UserPhotoService;
import taller.multimedia.backend.service.user.UserService;

/**
 * Staff users. Managing users is for the owner and admins; any signed-in user may view their own
 * profile; the About us teachers are public.
 */
@Validated
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserPhotoService userPhotoService;

    public UserController(UserService userService, UserPhotoService userPhotoService) {
        this.userService = userService;
        this.userPhotoService = userPhotoService;
    }

    /**
     * {@code GET /api/users}
     *
     * @param page page number, from 0
     * @param size page size, 1 to 10
     * @param role role to filter by, optional
     * @return users sorted by last name, or 400 with the reason
     */
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @GetMapping
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(10) int size,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String search) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("lastName"));
            String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            Page<UserInfoResponse> users = userService.getAllUsers(currentEmail, pageable, role, search);
            return ResponseEntity.ok(users);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * {@code GET /api/users/{id}}
     *
     * @param id user ID
     * @return the user, or 400 if it does not exist or the current user may not see it
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable UUID id) {
        try {
            String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            UserInfoResponse user = userService.getUser(id, currentEmail);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * {@code PUT /api/users/{id}}
     *
     * @param id user ID
     * @param request new data
     * @return the updated user, or 400 with the reason
     */
    @PreAuthorize ("hasAnyRole('OWNER', 'ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        try {
            String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            UserInfoResponse updatedUser = userService.updateUser(id, request, currentEmail);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * {@code DELETE /api/users/{id}}
     *
     * @param id user ID
     * @return a confirmation, or 400 with the reason
     */
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable UUID id) {
        try {
            String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            userService.deleteUser(id, currentEmail);
            return ResponseEntity.ok(new MessageResponse("User deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * {@code GET /api/users/teachers}
     *
     * @return active teachers
     */
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @GetMapping("/teachers")
    public ResponseEntity<List<UserInfoResponse>> getTeachers() {
        return ResponseEntity.ok(userService.getTeachers());
    }

    /**
     * {@code GET /api/users/teachers/about-us}, public.
     *
     * @return teachers shown on the About us page, without private data
     */
    @GetMapping("/teachers/about-us")
    public ResponseEntity<List<PublicTeacherResponse>> getAboutUsTeachers() {
        return ResponseEntity.ok(userService.getAboutUsTeachers());
    }

    /**
     * {@code POST /api/users/{id}/photo}: sets a teacher's profile photo.
     *
     * @param id teacher ID
     * @param file image
     * @return the updated user
     */
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @PostMapping("/{id}/photo")
    public ResponseEntity<UserInfoResponse> uploadPhoto(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userPhotoService.uploadTeacherPhoto(id, file));
    }

    /**
     * {@code DELETE /api/users/{id}/photo}
     *
     * @param id user ID
     * @return 204
     */
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @DeleteMapping("/{id}/photo")
    public ResponseEntity<Void> deletePhoto(@PathVariable UUID id) {
        userPhotoService.deleteTeacherPhoto(id);
        return ResponseEntity.noContent().build();
    }
}
