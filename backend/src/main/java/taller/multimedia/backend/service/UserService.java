package taller.multimedia.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import taller.multimedia.backend.dto.UpdateUserRequest;
import taller.multimedia.backend.dto.UserInfoResponse;
import taller.multimedia.backend.model.Role;
import taller.multimedia.backend.model.User;
import taller.multimedia.backend.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserInfoResponse> getAllUsers(String currentEmail) {
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!canManageUsers(currentUser.getRole())) {
            throw new RuntimeException("Only owners and admins can list users");
        }

        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public UserInfoResponse getUser(UUID targetId, String currentEmail) {
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        User targetUser = userRepository.findById(targetId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean canViewAllUsers = canManageUsers(currentUser.getRole());
        boolean isSelf = currentUser.getId().equals(targetUser.getId());

        if (!canViewAllUsers && !isSelf) {
            throw new RuntimeException("You do not have permission to view this user");
        }

        return toResponse(targetUser);
    }

    public UserInfoResponse updateUser(UUID targetId, UpdateUserRequest request, String currentEmail) {
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User targetUser = userRepository.findById(targetId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isSelf = currentUser.getId().equals(targetUser.getId());

        if (!canEditUser(currentUser.getRole(), targetUser.getRole(), isSelf)) {
            throw new RuntimeException("You do not have permission to edit this user");
        }

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

    public void deleteUser(UUID targetId, String currentEmail) {
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User targetUser = userRepository.findById(targetId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isSelf = currentUser.getId().equals(targetUser.getId());

        if (isSelf) {
            throw new RuntimeException("You cannot delete your own account");
        }

        if (!canDeleteUser(currentUser.getRole(), targetUser.getRole())) {
            throw new RuntimeException("You do not have permission to delete this user");
        }

        userRepository.delete(targetUser);
    }

    private UserInfoResponse toResponse(User user) {
        return new UserInfoResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole().name());
    }

    private boolean canManageUsers(Role role) {
        return role == Role.OWNER || role == Role.ADMIN;
    }

    private boolean canDeleteUser(Role currentRole, Role targetRole) {
        if (currentRole == Role.OWNER) {
            return targetRole == Role.ADMIN || targetRole == Role.TEACHER;
        }

        if (currentRole == Role.ADMIN) {
            return targetRole == Role.TEACHER;
        }

        return false;
    }

    private boolean canEditUser(Role currentRole, Role targetRole, boolean isSelf) {
        if (currentRole == Role.OWNER) {
            return true;
        }

        if (currentRole == Role.ADMIN) {
            return isSelf || targetRole == Role.TEACHER;
        }

        return false;
    }
}
