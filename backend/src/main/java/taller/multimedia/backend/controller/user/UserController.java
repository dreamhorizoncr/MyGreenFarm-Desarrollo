package taller.multimedia.backend.controller.user;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
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
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import jakarta.validation.Valid;
import taller.multimedia.backend.dto.MessageResponse;
import taller.multimedia.backend.dto.UpdateUserRequest;
import taller.multimedia.backend.dto.UserInfoResponse;
import taller.multimedia.backend.service.user.UserPhotoService;
import taller.multimedia.backend.service.user.UserService;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserPhotoService userPhotoService;

    public UserController(UserService userService, UserPhotoService userPhotoService) {
        this.userService = userService;
        this.userPhotoService = userPhotoService;
    }

    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @GetMapping
    public ResponseEntity<?> getAllUsers(
            @PageableDefault(size = 10, sort = "lastName") Pageable pageable) {
        try {
            String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            Page<UserInfoResponse> users = userService.getAllUsers(currentEmail, pageable);
            return ResponseEntity.ok(users);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

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

    @GetMapping("/teachers")
    public ResponseEntity<List<UserInfoResponse>> getTeachers() {
        return ResponseEntity.ok(userService.getTeachers());
    }

    @PostMapping("/{id}/photo")
    public ResponseEntity<UserInfoResponse> uploadPhoto(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userPhotoService.uploadTeacherPhoto(id, file));
    }

    @DeleteMapping("/{id}/photo")
    public ResponseEntity<Void> deletePhoto(@PathVariable UUID id) {
        userPhotoService.deleteTeacherPhoto(id);
        return ResponseEntity.noContent().build();
    }
}
