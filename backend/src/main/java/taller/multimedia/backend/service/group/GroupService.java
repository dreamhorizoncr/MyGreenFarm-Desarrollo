
package taller.multimedia.backend.service.group;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import taller.multimedia.backend.dto.child.ChildOptionResponse;
import taller.multimedia.backend.dto.group.GroupRequest;
import taller.multimedia.backend.dto.group.GroupResponse;
import taller.multimedia.backend.model.group.Group;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.group.GroupRepository;
import taller.multimedia.backend.repository.user.UserRepository;
import taller.multimedia.backend.util.Sanitizer;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    @Transactional
    public GroupResponse create(GroupRequest request) {
        User teacher = findTeacher(request.getTeacherId());

        Group group = new Group();
        group.setName(Sanitizer.requireClean("name", request.getName()));
        group.setDescription(request.getDescription() == null
                ? null
                : Sanitizer.requireCleanPreserveLineBreaks("description", request.getDescription()));
        group.setMaxCapacity(request.getMaxCapacity());
        group.setTeacherUser(teacher);

        return mapToResponse(groupRepository.save(group));
    }

    @Transactional
    public GroupResponse update(Long id, GroupRequest request) {
        Group group = groupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Grupo no encontrado con ID: " + id));

        group.setName(Sanitizer.requireClean("name", request.getName()));
        group.setDescription(request.getDescription() == null
                ? null
                : Sanitizer.requireCleanPreserveLineBreaks("description", request.getDescription()));
        group.setMaxCapacity(request.getMaxCapacity());
        group.setTeacherUser(findTeacher(request.getTeacherId()));

        return mapToResponse(groupRepository.save(group));
    }

    @Transactional
    public void delete(Long id) {
        Group group = groupRepository.findByIdWithChildren(id)
                .orElseThrow(() -> new EntityNotFoundException("Grupo no encontrado con ID: " + id));

        // Desvincular estudiantes sin eliminarlos
        for (var child : group.getChildren()) {
            child.setGroup(null);
        }

        group.getChildren().clear();

        // Eliminar únicamente el grupo
        groupRepository.delete(group);
    }

    @Transactional
    public List<GroupResponse> getAll() {
        return groupRepository.findAllWithChildren()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public GroupResponse getById(Long id) {
        Group group = groupRepository.findByIdWithChildren(id)
                .orElseThrow(() -> new EntityNotFoundException("Grupo no encontrado con ID: " + id));

        return mapToResponse(group);
    }

    @Transactional
    public GroupResponse getByIdForTeacher(Long id, UUID teacherId) {
        Group group = groupRepository.findByIdWithChildren(id)
                .orElseThrow(() -> new EntityNotFoundException("Grupo no encontrado con ID: " + id));

        if (!group.getTeacherUser().getId().equals(teacherId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "No tiene permiso para consultar este grupo");
        }

        return mapToResponse(group);
    }

    @Transactional
    public List<GroupResponse> getByTeacher(UUID teacherId) {
        return groupRepository.findByTeacherUserId(teacherId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private User findTeacher(UUID teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new EntityNotFoundException("Teacher no encontrado con ID: " + teacherId));

        if (teacher.getRole() != Role.TEACHER) {
            throw new IllegalArgumentException("El usuario seleccionado no tiene el rol de teacher");
        }

        return teacher;
    }

    private GroupResponse mapToResponse(Group group) {
        List<ChildOptionResponse> children = group.getChildren() == null
                ? List.of()
                : group.getChildren()
                        .stream()
                        .map(child -> new ChildOptionResponse(
                                child.getId(),
                                child.getStudentId(),
                                child.getFirstName() + " " + child.getLastName()))
                        .toList();

        int enrolledChildren = children.size();

        Integer availableSpots = group.getMaxCapacity() == null
                ? null
                : Math.max(0, group.getMaxCapacity() - enrolledChildren);

        User teacher = group.getTeacherUser();

        return GroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .maxCapacity(group.getMaxCapacity())
                .enrolledChildren(enrolledChildren)
                .availableSpots(availableSpots)
                .teacherId(teacher.getId())
                .teacherName((teacher.getFirstName() + " " + teacher.getLastName()).trim())
                .children(children)
                .build();
    }
}
