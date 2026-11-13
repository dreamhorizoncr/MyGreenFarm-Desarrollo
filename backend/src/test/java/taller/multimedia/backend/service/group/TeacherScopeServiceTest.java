package taller.multimedia.backend.service.group;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.server.ResponseStatusException;

import taller.multimedia.backend.model.child.Child;
import taller.multimedia.backend.model.group.ChildGroup;
import taller.multimedia.backend.model.group.Group;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.group.GroupRepository;
import taller.multimedia.backend.repository.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class TeacherScopeServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private GroupRepository groupRepository;

    @InjectMocks
    private TeacherScopeService teacherScope;

    private static Authentication as(String role) {
        return new UsernamePasswordAuthenticationToken("alfredo@test.com", null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }

    @Test
    void ownerAndAdminHaveNoLimit() {
        assertThat(teacherScope.visibleChildIds(as("OWNER"))).isEmpty();
        assertThat(teacherScope.visibleChildIds(as("ADMIN"))).isEmpty();
        assertThatCode(() -> teacherScope.requireChild(as("ADMIN"), 99L)).doesNotThrowAnyException();
        verifyNoInteractions(userRepository, groupRepository);
    }

    @Test
    void teacherSeesOnlyTheChildrenInTheirGroups() {
        givenTeacherWithChildren(1L, 2L);

        assertThat(teacherScope.visibleChildIds(as("TEACHER"))).contains(java.util.Set.of(1L, 2L));
        assertThatCode(() -> teacherScope.requireChild(as("TEACHER"), 2L)).doesNotThrowAnyException();
        assertThatThrownBy(() -> teacherScope.requireChild(as("TEACHER"), 3L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
    }

    @Test
    void teacherWithoutGroupsSeesNobody() {
        givenTeacherWithChildren();

        assertThat(teacherScope.visibleChildIds(as("TEACHER"))).contains(java.util.Set.of());
    }

    private void givenTeacherWithChildren(Long... childIds) {
        User teacher = new User();
        teacher.setId(UUID.randomUUID());
        Group group = new Group();
        group.setChildGroups(java.util.Arrays.stream(childIds).map(id -> {
            Child child = new Child();
            child.setId(id);
            ChildGroup childGroup = new ChildGroup();
            childGroup.setChild(child);
            childGroup.setGroup(group);
            return childGroup;
        }).toList());
        when(userRepository.findByEmail("alfredo@test.com")).thenReturn(Optional.of(teacher));
        when(groupRepository.findByTeacherId(teacher.getId())).thenReturn(childIds.length == 0 ? List.of() : List.of(group));
    }
}
