package taller.multimedia.backend.service.user;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import jakarta.transaction.Transactional;
import taller.multimedia.backend.dto.UpdateUserRequest;
import taller.multimedia.backend.dto.UserInfoResponse;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.user.UserRepository;
import taller.multimedia.backend.service.appointment.CalendarSyncAsyncService;
import taller.multimedia.backend.util.Sanitizer;

@Service
public class UserService {

    private final CalendarSyncAsyncService calendarSyncAsyncService;
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository, CalendarSyncAsyncService calendarSyncAsyncService) {
        this.userRepository = userRepository;
        this.calendarSyncAsyncService = calendarSyncAsyncService;
    }

    public Page<UserInfoResponse> getAllUsers(String currentEmail, Pageable pageable) {
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!canManageUsers(currentUser.getRole())) {
            throw new RuntimeException("Only owners and admins can list users");
        }

        return userRepository.findAll(pageable).map(this::toResponse);
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

    @Transactional
    public UserInfoResponse updateUser(UUID targetId, UpdateUserRequest request, String currentEmail) {
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User targetUser = userRepository.findById(targetId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isSelf = currentUser.getId().equals(targetUser.getId());

        if (!canEditUser(currentUser.getRole(), targetUser.getRole(), isSelf)) {
            throw new RuntimeException("You do not have permission to edit this user");
        }

        targetUser.setFirstName(Sanitizer.requireClean("firstName", request.getFirstName()));
        targetUser.setLastName(Sanitizer.requireClean("lastName", request.getLastName()));

        if (isSelf) {
            applyEmailChange(targetUser, request.getEmail());
        }

        applyBirthday(targetUser, request.getBirthday());
        applyPhotoUrl(targetUser, request.getPhotoUrl());

        return toResponse(targetUser);
    }

    private void applyEmailChange(User user, String rawEmail) {
        String newEmail = Sanitizer.requireClean("email", rawEmail);
        if (newEmail.equals(user.getEmail()))
            return;
        if (userRepository.existsByEmail(newEmail)) {
            throw new RuntimeException("Error: Email is already in use!");
        }
        user.setEmail(newEmail);
    }

    private void applyBirthday(User user, LocalDate birthday) {
        if (birthday == null)
            return;
        if (user.getRole() != Role.TEACHER) {
            throw new RuntimeException("Only teachers can set a birthday");
        }
        if (birthday.equals(user.getBirthday()))
            return;

        user.setBirthday(birthday);
        scheduleBirthdaySync(user.getId());
    }

    private void applyPhotoUrl(User user, String rawPhotoUrl) {
        if (rawPhotoUrl == null || rawPhotoUrl.isBlank()) {
            if (user.getRole() == Role.TEACHER) {
                user.setPhotoUrl(null);
            }
            return;
        }

        if (user.getRole() != Role.TEACHER) {
            throw new RuntimeException("Only teachers can set a profile photo");
        }

        String cleanPhotoUrl = Sanitizer.requireClean("photoUrl", rawPhotoUrl);
        user.setPhotoUrl(cleanPhotoUrl);
    }

    private void scheduleBirthdaySync(UUID userId) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                calendarSyncAsyncService.syncBirthdayAsync(userId);
            }
        });

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
                user.getRole().name(),
                user.getBirthday());
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

    public List<UserInfoResponse> getTeachers() {
        return userRepository.findByRole(Role.TEACHER)
                .stream()
                .map(this::toResponse)
                .toList();
    }
}
