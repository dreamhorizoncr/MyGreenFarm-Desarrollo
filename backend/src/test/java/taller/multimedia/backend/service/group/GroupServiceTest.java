package taller.multimedia.backend.service.group;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.group.GroupRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.group.ChildGroup;
import taller.multimedia.backend.model.group.Group;
import taller.multimedia.backend.repository.child.ChildRepository;
import taller.multimedia.backend.repository.group.ChildGroupRepository;
import taller.multimedia.backend.repository.group.GroupRepository;
import taller.multimedia.backend.repository.user.UserRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

    @Mock
    private GroupRepository groupRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ChildRepository childRepository;
    @Mock
    private ChildGroupRepository childGroupRepository;

    @InjectMocks
    private GroupService groupService;

    private static GroupRequest request(String name) {
        GroupRequest request = new GroupRequest();
        request.setName(name);
        return request;
    }

    @Test
    void create_rejectsANameThatAlreadyExists() {
        when(groupRepository.existsByNameIgnoreCase("Maternal A")).thenReturn(true);

        InvalidFieldException ex = assertThrows(InvalidFieldException.class, () -> groupService.create(request("Maternal A")));

        assertEquals("name", ex.getField());
        verify(groupRepository, never()).save(any());
    }

    @Test
    void update_rejectsTheNameOfAnotherGroup() {
        Group group = new Group();
        group.setId(7L);
        group.setName("Maternal B");
        when(groupRepository.findById(7L)).thenReturn(Optional.of(group));
        when(groupRepository.existsByNameIgnoreCaseAndIdNot("Maternal A", 7L)).thenReturn(true);

        assertThrows(InvalidFieldException.class, () -> groupService.update(7L, request("Maternal A")));
        verify(groupRepository, never()).save(any());
    }

    @Test
    void addChild_rejectsAFullGroup() {
        Group group = new Group();
        group.setId(3L);
        group.setMaxCapacity(1);
        group.setChildGroups(List.of(new ChildGroup()));
        when(groupRepository.findByIdWithChildren(3L)).thenReturn(Optional.of(group));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> groupService.addChild(3L, 99L));

        assertEquals("The group has no spots left", ex.getMessage());
        verify(childGroupRepository, never()).save(any());
    }
}
