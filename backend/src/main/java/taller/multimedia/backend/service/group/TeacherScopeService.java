package taller.multimedia.backend.service.group;

import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.model.child.Child;
import taller.multimedia.backend.model.group.ChildGroup;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.group.GroupRepository;
import taller.multimedia.backend.repository.user.UserRepository;

/**
 * Restricts teachers to the children of the groups they lead. Other roles (owner, admin) are not
 * restricted by this service.
 */
@Service
@RequiredArgsConstructor
public class TeacherScopeService {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    /**
     * Returns the IDs of the children a teacher may see.
     *
     * @param authentication current user
     * @return the child IDs of the teacher's groups, or an empty {@code Optional} when the user is
     *     not a teacher and therefore has no restriction
     * @throws ResponseStatusException with 403 if the authenticated teacher no longer exists
     */
    @Transactional(readOnly = true)
    public Optional<Set<Long>> visibleChildIds(Authentication authentication) {
        if (!isTeacher(authentication)) {
            return Optional.empty();
        }
        User teacher = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User not found"));
        Set<Long> childIds = groupRepository.findByTeacherId(teacher.getId()).stream()
                .flatMap(group -> group.getChildGroups().stream())
                .map(ChildGroup::getChild)
                .filter(Objects::nonNull)
                .map(Child::getId)
                .collect(Collectors.toSet());
        return Optional.of(childIds);
    }

    /**
     * Checks that a teacher may access a child. Users who are not teachers always pass.
     *
     * @param authentication current user
     * @param childId child being accessed
     * @throws ResponseStatusException with 403 if the child is not in any of the teacher's groups
     */
    @Transactional(readOnly = true)
    public void requireChild(Authentication authentication, Long childId) {
        visibleChildIds(authentication).ifPresent(childIds -> {
            if (childId == null || !childIds.contains(childId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This child is not in your groups");
            }
        });
    }

    /**
     * @param authentication current user, may be {@code null}
     * @return whether the user has the {@code ROLE_TEACHER} authority
     */
    private static boolean isTeacher(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_TEACHER".equals(authority.getAuthority()));
    }
}
