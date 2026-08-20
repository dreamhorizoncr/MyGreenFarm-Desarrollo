package taller.multimedia.backend.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import taller.multimedia.backend.dto.UpdateUserRequest;
import taller.multimedia.backend.dto.UserInfoResponse;
import taller.multimedia.backend.model.User;
import taller.multimedia.backend.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserInfoResponse getUser(UUID targetId, String currentEmail) {
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        User targetUser = userRepository.findById(targetId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isAdmin = currentUser.getRole() == taller.multimedia.backend.model.Role.ADMIN;
        boolean isSelf = currentUser.getId().equals(targetUser.getId());

        if (!isAdmin && !isSelf) {
            throw new RuntimeException("You do not have permission to view this user");
        }

        return toResponse(targetUser);
    }

    public UserInfoResponse updateUser(UUID targetId, UpdateUserRequest request, String currentEmail) {
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        boolean isAdmin = currentUser.getRole() == taller.multimedia.backend.model.Role.ADMIN;

        if (!isAdmin) {
            throw new RuntimeException("Only admins can edit users");
        }

        User targetUser = userRepository.findById(targetId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isSelf = currentUser.getId().equals(targetUser.getId());

        targetUser.setFirstName(request.getFirstName());
        targetUser.setLastName(request.getLastName());

        if (isSelf) {
            String newEmail = request.getEmail().trim();
            if (!newEmail.equals(targetUser.getEmail())) {
                if (userRepository.existsByEmail(newEmail)) {
                    throw new RuntimeException("Error: Email is already in use!");
                }
                targetUser.setEmail(newEmail);
            }
        }

        userRepository.save(targetUser);

        return toResponse(targetUser);
    }

    private UserInfoResponse toResponse(User user) {
        return new UserInfoResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole().name());
    }
}
