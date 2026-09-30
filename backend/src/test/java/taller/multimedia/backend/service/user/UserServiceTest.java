package taller.multimedia.backend.service.user;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.UpdateUserRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.user.UserRepository;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

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
}
