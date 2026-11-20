package taller.multimedia.backend.service.user;

import taller.multimedia.backend.util.SearchPattern;
import java.util.Optional;
import java.util.Arrays;
import java.util.Locale;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import jakarta.transaction.Transactional;
import taller.multimedia.backend.dto.user.UpdateUserRequest;
import taller.multimedia.backend.dto.user.PublicTeacherResponse;
import taller.multimedia.backend.dto.user.UserInfoResponse;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.forum.ForumArticleRepository;
import taller.multimedia.backend.repository.group.TeacherGroupRepository;
import taller.multimedia.backend.repository.user.UserRepository;
import taller.multimedia.backend.service.appointment.CalendarSyncAsyncService;
import taller.multimedia.backend.util.Sanitizer;
import taller.multimedia.backend.util.AfterCommit;

/**
 * Staff users (owner, admins and teachers) and the permissions between them.
 *
 * <p>Owners and admins may list users. The owner may edit anyone and delete admins and teachers; an
 * admin may edit itself and teachers and delete teachers. Nobody may delete their own account.
 */
@Service
public class UserService {

    private final CalendarSyncAsyncService calendarSyncAsyncService;
    private final UserRepository userRepository;
    private final ForumArticleRepository forumArticleRepository;
    private final TeacherGroupRepository teacherGroupRepository;

    public UserService(UserRepository userRepository, CalendarSyncAsyncService calendarSyncAsyncService,
            ForumArticleRepository forumArticleRepository, TeacherGroupRepository teacherGroupRepository) {
        this.userRepository = userRepository;
        this.calendarSyncAsyncService = calendarSyncAsyncService;
        this.forumArticleRepository = forumArticleRepository;
        this.teacherGroupRepository = teacherGroupRepository;
    }

    /**
     * @param currentEmail email of the authenticated user
     * @param pageable page to return
     * @return all users
     * @throws RuntimeException if the user is not an owner or admin
     */
    public Page<UserInfoResponse> getAllUsers(String currentEmail, Pageable pageable) {
        return getAllUsers(currentEmail, pageable, null);
    }

    /**
     * @param currentEmail email of the authenticated user
     * @param pageable page to return
     * @param role role to filter by, or {@code null} for all
     * @return the users
     * @throws RuntimeException if the user is not an owner or admin
     */
    public Page<UserInfoResponse> getAllUsers(String currentEmail, Pageable pageable, Role role) {
        return getAllUsers(currentEmail, pageable, role, null);
    }

    /**
     * @param currentEmail email of the authenticated user
     * @param pageable page to return
     * @param role role to filter by, or {@code null} for all
     * @param search text to look for in the name, email and role, optional
     * @return the users, filtered by the text when there is one
     * @throws RuntimeException if the user is not an owner or admin
     */
    public Page<UserInfoResponse> getAllUsers(String currentEmail, Pageable pageable, Role role, String search) {
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!canManageUsers(currentUser.getRole())) {
            throw new RuntimeException("Only owners and admins can list users");
        }

        Optional<String> pattern = SearchPattern.of(search);
        Page<User> users;
        if (pattern.isPresent()) {
            String text = search.trim().toUpperCase(Locale.ROOT);
            List<Role> rolesByName = Arrays.stream(Role.values()).filter(r -> r.name().contains(text)).toList();
            List<Role> roles = role == null ? List.of(Role.values()) : List.of(role);
            users = userRepository.search(roles, pattern.get(), rolesByName, pageable);
        } else {
            users = role == null ? userRepository.findAll(pageable) : userRepository.findByRole(role, pageable);
        }
        return users.map(this::toResponse);
    }

    /**
     * @param targetId user to view
     * @param currentEmail email of the authenticated user
     * @return the user
     * @throws RuntimeException if a user does not exist, or a teacher tries to view someone else
     */
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

    /**
     * Updates a user's profile. Users may only change their own email; birthdays, photos and the
     * About us flag only apply to teachers. A birthday change is synced to Google Calendar after
     * the transaction commits.
     *
     * @param targetId user to update
     * @param request new data
     * @param currentEmail email of the authenticated user
     * @return the updated user
     * @throws RuntimeException if a user does not exist, permission is missing, the email is taken,
     *     or a non-teacher gets a birthday or photo
     * @throws taller.multimedia.backend.exception.InvalidFieldException if a text is unsafe
     */
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
        applyShowOnAboutUs(targetUser, request.getShowOnAboutUs());

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

    private void applyShowOnAboutUs(User user, Boolean showOnAboutUs) {
        if (showOnAboutUs != null && user.getRole() == Role.TEACHER) {
            user.setShowOnAboutUs(showOnAboutUs);
        }
    }

    private void scheduleBirthdaySync(UUID userId) {
        AfterCommit.run(() -> calendarSyncAsyncService.syncBirthdayAsync(userId));

    }

    /**
     * Deletes a user. Their forum articles are kept without an author and they are removed from
     * their groups.
     *
     * @param targetId user to delete
     * @param currentEmail email of the authenticated user
     * @throws RuntimeException if a user does not exist, it is the user's own account, or
     *     permission is missing
     */
    @Transactional
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

        forumArticleRepository.unlinkAuthor(targetUser.getId());
        teacherGroupRepository.deleteByTeacherId(targetUser.getId());
        userRepository.delete(targetUser);
    }

    private UserInfoResponse toResponse(User user) {
        return new UserInfoResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole().name(),
                user.getBirthday(),
                user.getPhotoUrl(),
                user.isShowOnAboutUs());
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

    /**
     * @return active teachers
     */
    public List<UserInfoResponse> getTeachers() {
        return userRepository.findByRole(Role.TEACHER)
                .stream()
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .map(this::toResponse)
                .toList();
    }

    /**
     * @return active teachers who chose to appear on the About us page, without private data
     */
    public List<PublicTeacherResponse> getAboutUsTeachers() {
        return userRepository.findByRole(Role.TEACHER)
                .stream()
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()) && user.isShowOnAboutUs())
                .map(user -> new PublicTeacherResponse(
                        user.getId(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getRole().name(),
                        user.getPhotoUrl()))
                .toList();
    }
}
