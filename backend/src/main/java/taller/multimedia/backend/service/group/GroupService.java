
package taller.multimedia.backend.service.group;

import java.util.List;
import java.util.ArrayList;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import taller.multimedia.backend.dto.child.ChildOptionResponse;
import taller.multimedia.backend.dto.group.GroupRequest;
import taller.multimedia.backend.dto.group.GroupResponse;
import taller.multimedia.backend.model.child.Child;
import taller.multimedia.backend.model.group.ChildGroup;
import taller.multimedia.backend.model.group.Group;
import taller.multimedia.backend.model.group.TeacherGroup;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.child.ChildRepository;
import taller.multimedia.backend.repository.group.ChildGroupRepository;
import taller.multimedia.backend.repository.group.GroupRepository;
import taller.multimedia.backend.repository.user.UserRepository;
import taller.multimedia.backend.util.Sanitizer;

@Service
@RequiredArgsConstructor
public class GroupService {

        private final GroupRepository groupRepository;
        private final UserRepository userRepository;
        private final ChildRepository childRepository;
        private final ChildGroupRepository childGroupRepository;

        @Transactional
        public GroupResponse create(GroupRequest request) {
                Group group = new Group();
                group.setName(Sanitizer.requireClean("name", request.getName()));
                group.setDescription(request.getDescription() == null
                                ? null
                                : Sanitizer.requireCleanPreserveLineBreaks("description", request.getDescription()));
                group.setMaxCapacity(request.getMaxCapacity());
                group.setTeacherGroups(createTeacherGroups(group, request.getTeacherIds()));
                group.setChildGroups(createChildGroups(group, request.getChildIds()));

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
                group.getTeacherGroups().clear();
                group.getTeacherGroups().addAll(createTeacherGroups(group, request.getTeacherIds()));
                if (request.getChildIds() != null) {
                        List<ChildGroup> newChildGroups = createChildGroups(group, request.getChildIds());
                        group.getChildGroups().clear();
                        childGroupRepository.flush();
                        group.getChildGroups().addAll(newChildGroups);
                }

                return mapToResponse(groupRepository.save(group));
        }

        @Transactional
        public void delete(Long id) {
                Group group = groupRepository.findByIdWithChildren(id)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Grupo no encontrado con ID: " + id));

                group.getChildGroups().clear();
                groupRepository.delete(group);
        }

        @Transactional
        public GroupResponse addChild(Long groupId, Long childId) {
                Group group = groupRepository.findByIdWithChildren(groupId)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Grupo no encontrado con ID: " + groupId));

                if (group.getMaxCapacity() != null
                                && group.getChildGroups().size() >= group.getMaxCapacity()) {
                        throw new IllegalArgumentException("El grupo ya no tiene cupos disponibles");
                }

                Child child = childRepository.findById(childId)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Niño no encontrado con ID: " + childId));
                if (!childGroupRepository.findByChildIdIn(Set.of(childId)).isEmpty()) {
                        throw new IllegalArgumentException(
                                        "El niño con ID " + childId + " ya pertenece a un grupo");
                }

                ChildGroup childGroup = new ChildGroup();
                childGroup.setGroup(group);
                childGroup.setChild(child);
                childGroupRepository.save(childGroup);

                return getById(groupId);
        }

        @Transactional
        public GroupResponse removeChild(Long groupId, Long childId) {
                ChildGroup childGroup = childGroupRepository.findByGroupIdAndChildId(groupId, childId)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "El niño no pertenece al grupo indicado"));

                childGroupRepository.delete(childGroup);
                childGroupRepository.flush();

                return getById(groupId);
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

                boolean assigned = group.getTeacherGroups().stream()
                                .anyMatch(teacherGroup -> teacherGroup.getTeacher().getId().equals(teacherId));
                if (!assigned) {
                        throw new org.springframework.security.access.AccessDeniedException(
                                        "No tiene permiso para consultar este grupo");
                }

                return mapToResponse(group);
        }

        @Transactional
        public List<GroupResponse> getByTeacher(UUID teacherId) {
                return groupRepository.findByTeacherId(teacherId)
                                .stream()
                                .map(this::mapToResponse)
                                .toList();
        }

        private User findTeacher(UUID teacherId) {
                User teacher = userRepository.findById(teacherId)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Teacher no encontrado con ID: " + teacherId));

                if (teacher.getRole() != Role.TEACHER) {
                        throw new IllegalArgumentException("El usuario seleccionado no tiene el rol de teacher");
                }

                return teacher;
        }

        private List<TeacherGroup> createTeacherGroups(Group group, Set<UUID> teacherIds) {
                return new ArrayList<>(teacherIds.stream()
                                .map(this::findTeacher)
                                .map(teacher -> {
                                        TeacherGroup teacherGroup = new TeacherGroup();
                                        teacherGroup.setGroup(group);
                                        teacherGroup.setTeacher(teacher);
                                        return teacherGroup;
                                })
                                .toList());
        }

        private List<ChildGroup> createChildGroups(Group group, Set<Long> childIds) {
                if (childIds == null || childIds.isEmpty()) {
                        return new ArrayList<>();
                }

                if (group.getMaxCapacity() != null && childIds.size() > group.getMaxCapacity()) {
                        throw new IllegalArgumentException("La cantidad de niños supera la capacidad máxima del grupo");
                }

                List<Child> children = childRepository.findAllById(childIds);
                if (children.size() != childIds.size()) {
                        throw new EntityNotFoundException("Uno o más niños no fueron encontrados");
                }

                childGroupRepository.findByChildIdIn(childIds).stream()
                                .filter(childGroup -> group.getId() == null
                                                || !childGroup.getGroup().getId().equals(group.getId()))
                                .findFirst()
                                .ifPresent(childGroup -> {
                                        throw new IllegalArgumentException(
                                                        "El niño con ID " + childGroup.getChild().getId()
                                                                        + " ya pertenece a otro grupo");
                                });

                return children.stream()
                                .map(child -> {
                                        ChildGroup childGroup = new ChildGroup();
                                        childGroup.setGroup(group);
                                        childGroup.setChild(child);
                                        return childGroup;
                                })
                                .collect(Collectors.toCollection(ArrayList::new));
        }

        private GroupResponse mapToResponse(Group group) {
                List<ChildOptionResponse> children = group.getChildGroups() == null
                                ? List.of()
                                : group.getChildGroups()
                                                .stream()
                                                .map(ChildGroup::getChild)
                                                .map(child -> new ChildOptionResponse(
                                                                child.getId(),
                                                                child.getStudentId(),
                                                                child.getFirstName() + " " + child.getLastName()))
                                                .toList();

                int enrolledChildren = children.size();

                Integer availableSpots = group.getMaxCapacity() == null
                                ? null
                                : Math.max(0, group.getMaxCapacity() - enrolledChildren);

                List<User> teachers = group.getTeacherGroups()
                                .stream()
                                .map(TeacherGroup::getTeacher)
                                .toList();

                return GroupResponse.builder()
                                .id(group.getId())
                                .name(group.getName())
                                .description(group.getDescription())
                                .maxCapacity(group.getMaxCapacity())
                                .enrolledChildren(enrolledChildren)
                                .availableSpots(availableSpots)
                                .teacherIds(teachers.stream().map(User::getId).toList())
                                .teacherNames(teachers.stream()
                                                .map(teacher -> (teacher.getFirstName() + " " + teacher.getLastName())
                                                                .trim())
                                                .toList())
                                .children(children)
                                .build();
        }
}
