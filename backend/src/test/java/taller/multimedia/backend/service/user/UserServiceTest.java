package taller.multimedia.backend.service.user;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.UpdateUserRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.forum.ForumArticleRepository;
import taller.multimedia.backend.repository.group.TeacherGroupRepository;
import taller.multimedia.backend.repository.user.UserRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ForumArticleRepository forumArticleRepository;

    @Mock
    private TeacherGroupRepository teacherGroupRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void getAboutUsTeachers_leavesOutTeachersWhoOptedOutAndInactiveOnes() {
        User visible = userWith(Role.TEACHER);
        User hidden = userWith(Role.TEACHER);
        hidden.setShowOnAboutUs(false);
        User inactive = userWith(Role.TEACHER);
        inactive.setActive(false);
        when(userRepository.findByRole(Role.TEACHER)).thenReturn(java.util.List.of(visible, hidden, inactive));

        var teachers = userService.getAboutUsTeachers();

        assertEquals(1, teachers.size());
        assertEquals(visible.getId(), teachers.get(0).getId());
    }

    @Test
    void getTeachers_stillIncludesTeachersWhoOptedOut() {
        User hidden = userWith(Role.TEACHER);
        hidden.setShowOnAboutUs(false);
        when(userRepository.findByRole(Role.TEACHER)).thenReturn(java.util.List.of(hidden));

        assertEquals(1, userService.getTeachers().size());
    }

    @Test
    void updateUser_keepsTheChoiceWhenTheRequestDoesNotSendIt() {
        User owner = userWith(Role.OWNER);
        User teacher = userWith(Role.TEACHER);
        teacher.setShowOnAboutUs(false);
        when(userRepository.findByEmail("owner@ejemplo.com")).thenReturn(Optional.of(owner));
        when(userRepository.findById(teacher.getId())).thenReturn(Optional.of(teacher));

        UpdateUserRequest request = new UpdateUserRequest();
        request.setFirstName("Ana");
        request.setLastName("Pérez");
        request.setEmail("ana@gmail.com");
        userService.updateUser(teacher.getId(), request, "owner@ejemplo.com");
        assertFalse(teacher.isShowOnAboutUs());

        request.setShowOnAboutUs(true);
        userService.updateUser(teacher.getId(), request, "owner@ejemplo.com");
        assertTrue(teacher.isShowOnAboutUs());
    }

    private User userWith(Role role) {
        User user = new User("owner@ejemplo.com", "hashed", "Nombre", "Apellido", role, true);
        user.setId(UUID.randomUUID());
        return user;
    }

    @ParameterizedTest
    @ValueSource(strings = { "firstName", "lastName" })
    void updateUser_rejectsMaliciousNameFieldsAndNeverSaves(String field) {
        User owner = userWith(Role.OWNER);
        User teacher = userWith(Role.TEACHER);

        when(userRepository.findByEmail("owner@ejemplo.com")).thenReturn(Optional.of(owner));
        when(userRepository.findById(teacher.getId())).thenReturn(Optional.of(teacher));

        String maliciousValue = "<script>alert(1)</script>x";
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFirstName("Ana");
        request.setLastName("Pérez");
        request.setEmail("ana@gmail.com");

        switch (field) {
            case "firstName" -> request.setFirstName(maliciousValue);
            case "lastName" -> request.setLastName(maliciousValue);
            default -> throw new IllegalStateException("Campo no cubierto: " + field);
        }

        assertThrows(InvalidFieldException.class,
                () -> userService.updateUser(teacher.getId(), request, "owner@ejemplo.com"));

        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUser_rejectsAMaliciousEmailWhenEditingSelf() {
        User owner = userWith(Role.OWNER);

        lenient().when(userRepository.findByEmail("owner@ejemplo.com")).thenReturn(Optional.of(owner));
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));

        UpdateUserRequest request = new UpdateUserRequest();
        request.setFirstName("Ana");
        request.setLastName("Pérez");
        request.setEmail("<script>x</script>ana@gmail.com");

        assertThrows(InvalidFieldException.class,
                () -> userService.updateUser(owner.getId(), request, "owner@ejemplo.com"));

        verify(userRepository, never()).save(any());
    }

    @Test
    void deleteUser_removesTheTeacherFromTheirGroupsBeforeDeletingThem() {
        User owner = userWith(Role.OWNER);
        User teacher = userWith(Role.TEACHER);

        when(userRepository.findByEmail("owner@ejemplo.com")).thenReturn(Optional.of(owner));
        when(userRepository.findById(teacher.getId())).thenReturn(Optional.of(teacher));

        userService.deleteUser(teacher.getId(), "owner@ejemplo.com");

        // A teacher assigned to a group has rows in teacher_groups; they must be removed
        // first or the database rejects the delete.
        InOrder orden = inOrder(teacherGroupRepository, userRepository);
        orden.verify(teacherGroupRepository).deleteByTeacherId(teacher.getId());
        orden.verify(userRepository).delete(teacher);
    }

    @Test
    void deleteUser_doesNotTouchGroupsWhenNotAllowed() {
        User admin = userWith(Role.ADMIN);
        User otherAdmin = userWith(Role.ADMIN);

        when(userRepository.findByEmail("owner@ejemplo.com")).thenReturn(Optional.of(admin));
        when(userRepository.findById(otherAdmin.getId())).thenReturn(Optional.of(otherAdmin));

        assertThrows(RuntimeException.class,
                () -> userService.deleteUser(otherAdmin.getId(), "owner@ejemplo.com"));

        verify(teacherGroupRepository, never()).deleteByTeacherId(any());
        verify(userRepository, never()).delete(any());
    }
}
