
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
import taller.multimedia.backend.exception.InvalidFieldException;
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

/**
 * Class groups: their teachers, their children and their capacity. A child can belong to only one
 * group.
 */
@Service
@RequiredArgsConstructor
public class GroupService {

        private final GroupRepository groupRepository;
        private final UserRepository userRepository;
        private final ChildRepository childRepository;
        private static final String DUPLICATE_NAME_MESSAGE = "A group with that name already exists.";

        private final ChildGroupRepository childGroupRepository;

        /**
         * @param request name (unique, case-insensitive), description, capacity, teacher IDs and
         *     child IDs
         * @return the created group
         * @throws InvalidFieldException if the name is taken or a text is unsafe
         * @throws EntityNotFoundException if a teacher or child does not exist
         * @throws IllegalArgumentException if a user is not a teacher, there are more children than
         *     the capacity, or a child is already in another group
         */
        @Transactional
        public GroupResponse create(GroupRequest request) {
                Group group = new Group();
                String name = Sanitizer.requireClean("name", request.getName());
                if (groupRepository.existsByNameIgnoreCase(name)) {
                        throw new InvalidFieldException("name", DUPLICATE_NAME_MESSAGE);
                }
                group.setName(name);
                group.setDescription(request.getDescription() == null
                                ? null
                                : Sanitizer.requireCleanPreserveLineBreaks("description", request.getDescription()));
                group.setMaxCapacity(request.getMaxCapacity());
                group.setTeacherGroups(createTeacherGroups(group, request.getTeacherIds()));
                group.setChildGroups(createChildGroups(group, request.getChildIds()));

                return mapToResponse(groupRepository.save(group));
        }

        /**
         * Updates a group and replaces its teachers. Its children are only replaced when the
         * request includes child IDs.
         *
         * @param id group ID
         * @param request new data
         * @return the updated group
         * @throws EntityNotFoundException if the group, a teacher or a child does not exist
         * @throws InvalidFieldException if the name is taken or a text is unsafe
         * @throws IllegalArgumentException if a user is not a teacher, there are too many children,
         *     or a child is in another group
         */
        @Transactional
        public GroupResponse update(Long id, GroupRequest request) {
                Group group = groupRepository.findById(id)
                                .orElseThrow(() -> new EntityNotFoundException("Group not found with ID: " + id));

                String name = Sanitizer.requireClean("name", request.getName());
                if (groupRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
                        throw new InvalidFieldException("name", DUPLICATE_NAME_MESSAGE);
                }
                group.setName(name);
                group.setDescription(request.getDescription() == null
                                ? null
                                : Sanitizer.requireCleanPreserveLineBreaks("description", request.getDescription()));
                group.setMaxCapacity(request.getMaxCapacity());
                List<TeacherGroup> newTeacherGroups = createTeacherGroups(group, request.getTeacherIds());
                group.getTeacherGroups().clear();
                groupRepository.flush();
                group.getTeacherGroups().addAll(newTeacherGroups);
                if (request.getChildIds() != null) {
                        List<ChildGroup> newChildGroups = createChildGroups(group, request.getChildIds());
                        group.getChildGroups().clear();
                        childGroupRepository.flush();
                        group.getChildGroups().addAll(newChildGroups);
                }

                return mapToResponse(groupRepository.save(group));
        }

        /**
         * Deletes a group. Its children are not deleted, only removed from it.
         *
         * @param id group ID
         * @throws EntityNotFoundException if it does not exist
         */
        @Transactional
        public void delete(Long id) {
                Group group = groupRepository.findByIdWithChildren(id)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Group not found with ID: " + id));

                group.getChildGroups().clear();
                groupRepository.delete(group);
        }

        /**
         * @param groupId group ID
         * @param childId child to add
         * @return the updated group
         * @throws EntityNotFoundException if the group or child does not exist
         * @throws IllegalArgumentException if the group is full or the child already belongs to a
         *     group
         */
        @Transactional
        public GroupResponse addChild(Long groupId, Long childId) {
                Group group = groupRepository.findByIdWithChildren(groupId)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Group not found with ID: " + groupId));

                if (group.getMaxCapacity() != null
                                && group.getChildGroups().size() >= group.getMaxCapacity()) {
                        throw new IllegalArgumentException("The group has no spots left");
                }

                Child child = childRepository.findById(childId)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Child not found with ID: " + childId));
                if (!childGroupRepository.findByChildIdIn(Set.of(childId)).isEmpty()) {
                        throw new IllegalArgumentException(
                                        "The child with ID " + childId + " already belongs to a group");
                }

                ChildGroup childGroup = new ChildGroup();
                childGroup.setGroup(group);
                childGroup.setChild(child);
                childGroupRepository.save(childGroup);
                // the group is already loaded in this transaction, so its list must be updated by hand
                group.getChildGroups().add(childGroup);

                return getById(groupId);
        }

        /**
         * @param groupId group ID
         * @param childId child to remove
         * @return the updated group
         * @throws EntityNotFoundException if the child is not in the group
         */
        @Transactional
        public GroupResponse removeChild(Long groupId, Long childId) {
                ChildGroup childGroup = childGroupRepository.findByGroupIdAndChildId(groupId, childId)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "The child does not belong to the given group"));

                childGroupRepository.delete(childGroup);
                childGroupRepository.flush();

                return getById(groupId);
        }

        /**
         * @return all groups with their teachers and children
         */
        @Transactional
        public List<GroupResponse> getAll() {
                return groupRepository.findAllWithChildren()
                                .stream()
                                .map(this::mapToResponse)
                                .toList();
        }

        /**
         * @param id group ID
         * @return the group
         * @throws EntityNotFoundException if it does not exist
         */
        @Transactional
        public GroupResponse getById(Long id) {
                Group group = groupRepository.findByIdWithChildren(id)
                                .orElseThrow(() -> new EntityNotFoundException("Group not found with ID: " + id));

                return mapToResponse(group);
        }

        /**
         * @param id group ID
         * @param teacherId authenticated teacher
         * @return the group, if the teacher is assigned to it
         * @throws EntityNotFoundException if it does not exist
         * @throws org.springframework.security.access.AccessDeniedException if the teacher is not
         *     assigned to it
         */
        @Transactional
        public GroupResponse getByIdForTeacher(Long id, UUID teacherId) {
                Group group = groupRepository.findByIdWithChildren(id)
                                .orElseThrow(() -> new EntityNotFoundException("Group not found with ID: " + id));

                boolean assigned = group.getTeacherGroups().stream()
                                .anyMatch(teacherGroup -> teacherGroup.getTeacher().getId().equals(teacherId));
                if (!assigned) {
                        throw new org.springframework.security.access.AccessDeniedException(
                                        "You do not have permission to view this group");
                }

                return mapToResponse(group);
        }

        /**
         * @param teacherId teacher ID
         * @return the groups the teacher is assigned to
         */
        @Transactional
        public List<GroupResponse> getByTeacher(UUID teacherId) {
                return groupRepository.findByTeacherId(teacherId)
                                .stream()
                                .map(this::mapToResponse)
                                .toList();
        }

        /**
         * @param teacherId user ID
         * @return the user
         * @throws EntityNotFoundException if the user does not exist
         * @throws IllegalArgumentException if the user is not a teacher
         */
        private User findTeacher(UUID teacherId) {
                User teacher = userRepository.findById(teacherId)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Teacher not found with ID: " + teacherId));

                if (teacher.getRole() != Role.TEACHER) {
                        throw new IllegalArgumentException("The selected user does not have the teacher role");
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

        /**
         * @param group group being saved
         * @param childIds children to assign, may be {@code null}
         * @return the new memberships
         * @throws IllegalArgumentException if there are more children than the capacity or one is
         *     already in another group
         * @throws EntityNotFoundException if a child does not exist
         */
        private List<ChildGroup> createChildGroups(Group group, Set<Long> childIds) {
                if (childIds == null || childIds.isEmpty()) {
                        return new ArrayList<>();
                }

                if (group.getMaxCapacity() != null && childIds.size() > group.getMaxCapacity()) {
                        throw new IllegalArgumentException("The number of children exceeds the group's maximum capacity");
                }

                List<Child> children = childRepository.findAllById(childIds);
                if (children.size() != childIds.size()) {
                        throw new EntityNotFoundException("One or more children were not found");
                }

                childGroupRepository.findByChildIdIn(childIds).stream()
                                .filter(childGroup -> group.getId() == null
                                                || !childGroup.getGroup().getId().equals(group.getId()))
                                .findFirst()
                                .ifPresent(childGroup -> {
                                        throw new IllegalArgumentException(
                                                        "The child with ID " + childGroup.getChild().getId()
                                                                        + " already belongs to another group");
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
