package taller.multimedia.backend.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import taller.multimedia.backend.dto.MessageResponse;
import taller.multimedia.backend.dto.UpdateUserRequest;
import taller.multimedia.backend.dto.UserInfoResponse;
import taller.multimedia.backend.service.UserService;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
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
}
