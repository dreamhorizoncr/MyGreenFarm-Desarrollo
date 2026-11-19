package taller.multimedia.backend.service.child;

import taller.multimedia.backend.util.SearchPattern;
import java.util.Optional;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.child.ChildOptionResponse;
import taller.multimedia.backend.dto.child.ChildRequest;
import taller.multimedia.backend.dto.child.ChildResponse;
import taller.multimedia.backend.dto.child.ChildStatusFilter;
import taller.multimedia.backend.model.child.Child;
import taller.multimedia.backend.model.child.ChildClub;
import taller.multimedia.backend.model.club.Club;
import taller.multimedia.backend.model.parent.Parent;
import taller.multimedia.backend.repository.child.ChildClubRepository;
import taller.multimedia.backend.repository.child.ChildRepository;
import taller.multimedia.backend.repository.club.ClubRepository;
import taller.multimedia.backend.repository.parent.ParentRepository;
import taller.multimedia.backend.util.Sanitizer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Enrolled children and their club enrollments. Deleting a child deactivates it, and every
 * enrollment change recalculates the free spots of the affected clubs.
 */
@Service
@RequiredArgsConstructor
public class ChildService {

    private final ChildRepository childRepository;
    private final ParentRepository parentRepository;
    private final ClubRepository clubRepository;
    private final ChildClubRepository childClubRepository;
    private final StudentIdGeneratorService studentIdGeneratorService;

    /**
     * Enrolls a child with a new student ID and, optionally, in some clubs.
     *
     * @param request child data, the parent's identification and the club IDs
     * @return the enrolled child
     * @throws EntityNotFoundException if no parent has that identification
     * @throws IllegalArgumentException if a club has no spots left
     * @throws taller.multimedia.backend.exception.InvalidFieldException if a text is unsafe
     */
    @Transactional
    public ChildResponse create(ChildRequest request) {
        String parentIdentification = Sanitizer.requireClean("parentIdentification", request.getParentIdentification());

        Parent parent = parentRepository.findByIdentification(parentIdentification)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Parent/guardian not found with ID number: " + parentIdentification));

        String firstName = Sanitizer.requireClean("firstName", request.getFirstName());
        String lastName = Sanitizer.requireClean("lastName", request.getLastName());
        String medicalNotes = request.getMedicalNotes() == null ? null
                : Sanitizer.requireCleanPreserveLineBreaks("medicalNotes", request.getMedicalNotes());

        String studentId = studentIdGeneratorService.generateNextStudentId();

        Child child = Child.builder()
                .studentId(studentId)
                .parent(parent)
                .relationship(request.getRelationship())
                .firstName(firstName)
                .lastName(lastName)
                .birthDate(request.getBirthDate())
                .medicalNotes(medicalNotes)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .childClubs(new ArrayList<>())
                .build();

        Set<Long> affectedClubIds = new HashSet<>();

        if (request.getClubIds() != null && !request.getClubIds().isEmpty()) {
            List<Club> clubs = clubRepository.findAllById(request.getClubIds());
            for (Club club : clubs) {
                long enrolled = childClubRepository.countByClubId(club.getId());
                if (club.getMaxCapacity() != null && enrolled >= club.getMaxCapacity()) {
                    throw new IllegalArgumentException(
                            "The club '" + club.getName() + "' has no spots left.");
                }

                ChildClub childClub = new ChildClub();
                childClub.setChild(child);
                childClub.setClub(club);
                child.getChildClubs().add(childClub);

                affectedClubIds.add(club.getId());
            }
        }

        Child saved = childRepository.save(child);
        updateClubsAvailableSpots(affectedClubIds);

        return mapToResponse(saved);
    }

    /**
     * @param pageable page to return
     * @return active children
     */
    @Transactional(readOnly = true)
    public Page<ChildResponse> getAll(Pageable pageable) {
        return getAll(pageable, ChildStatusFilter.ACTIVE);
    }

    /**
     * @param pageable page to return
     * @param status active, inactive or all
     * @return the children with that status
     */
    @Transactional(readOnly = true)
    public Page<ChildResponse> getAll(Pageable pageable, ChildStatusFilter status) {
        return getAll(pageable, status, null);
    }

    /**
     * @param pageable page to return
     * @param status active, inactive or all
     * @param search text to look for in the names, student ID and medical notes, optional
     * @return the children with that status, filtered by the text when there is one
     */
    @Transactional(readOnly = true)
    public Page<ChildResponse> getAll(Pageable pageable, ChildStatusFilter status, String search) {
        Optional<String> pattern = SearchPattern.of(search);
        if (pattern.isPresent()) {
            List<Boolean> statuses = switch (status) {
                case ACTIVE -> List.of(true);
                case INACTIVE -> List.of(false);
                case ALL -> List.of(true, false);
            };
            return childRepository.search(statuses, pattern.get(), pageable).map(this::mapToResponse);
        }
        return switch (status) {
            case ACTIVE -> childRepository.findByIsActiveTrue(pageable).map(this::mapToResponse);
            case INACTIVE -> childRepository.findByIsActive(false, pageable).map(this::mapToResponse);
            case ALL -> childRepository.findAll(pageable).map(this::mapToResponse);
        };
    }

    /**
     * @param parentId parent ID
     * @param pageable page to return
     * @return the parent's active children
     */
    @Transactional(readOnly = true)
    public Page<ChildResponse> getByParentId(Long parentId, Pageable pageable) {
        return childRepository.findByParentIdAndIsActiveTrue(parentId, pageable).map(this::mapToResponse);
    }

    /**
     * @param id child ID
     * @return the child, active or not
     * @throws EntityNotFoundException if it does not exist
     */
    @Transactional(readOnly = true)
    public ChildResponse getById(Long id) {
        Child child = childRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Child record not found with ID: " + id));
        return mapToResponse(child);
    }

    /**
     * Updates a child and its clubs: clubs not in the request are left and new ones are joined if
     * they have spots.
     *
     * @param id child ID
     * @param request new data; {@code isActive} is only changed when sent
     * @return the updated child
     * @throws EntityNotFoundException if the child or parent does not exist
     * @throws IllegalArgumentException if a new club has no spots left
     * @throws taller.multimedia.backend.exception.InvalidFieldException if a text is unsafe
     */
    @Transactional
    public ChildResponse update(Long id, ChildRequest request) {
        Child child = childRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Child record not found with ID: " + id));

        Parent parent = parentRepository.findByIdentification(request.getParentIdentification())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Parent/guardian not found with ID number: " + request.getParentIdentification()));

        String firstName = Sanitizer.requireClean("firstName", request.getFirstName());
        String lastName = Sanitizer.requireClean("lastName", request.getLastName());
        String medicalNotes = request.getMedicalNotes() == null ? null
                : Sanitizer.requireCleanPreserveLineBreaks("medicalNotes", request.getMedicalNotes());

        Set<Long> affectedClubIds = new HashSet<>();
        Set<Long> targetClubIds = request.getClubIds() != null ? new HashSet<>(request.getClubIds()) : new HashSet<>();

        List<ChildClub> currentChildClubs = childClubRepository.findByChildId(child.getId());

        Set<Long> existingClubIds = currentChildClubs.stream()
                .map(childClub -> childClub.getClub().getId())
                .collect(Collectors.toSet());

        affectedClubIds.addAll(existingClubIds);

        List<ChildClub> toRemove = currentChildClubs.stream()
                .filter(childClub -> !targetClubIds.contains(childClub.getClub().getId()))
                .toList();

        if (!toRemove.isEmpty()) {
            childClubRepository.deleteAll(toRemove);
            childClubRepository.flush();
        }

        Set<Long> newClubIds = targetClubIds.stream()
                .filter(clubId -> !existingClubIds.contains(clubId))
                .collect(Collectors.toSet());

        if (!newClubIds.isEmpty()) {
            List<Club> newClubs = clubRepository.findAllById(newClubIds);
            List<ChildClub> newChildClubs = new ArrayList<>();

            for (Club club : newClubs) {
                long enrolled = childClubRepository.countByClubId(club.getId());
                if (club.getMaxCapacity() != null && enrolled >= club.getMaxCapacity()) {
                    throw new IllegalArgumentException(
                            "The club '" + club.getName() + "' has no spots left.");
                }

                ChildClub childClub = new ChildClub();
                childClub.setChild(child);
                childClub.setClub(club);
                newChildClubs.add(childClub);

                affectedClubIds.add(club.getId());
            }

            childClubRepository.saveAll(newChildClubs);
        }

        child.setParent(parent);
        child.setRelationship(request.getRelationship());
        child.setFirstName(firstName);
        child.setLastName(lastName);
        child.setBirthDate(request.getBirthDate());
        child.setMedicalNotes(medicalNotes);

        if (request.getIsActive() != null) {
            child.setIsActive(request.getIsActive());
        }

        Child updated = childRepository.save(child);
        updateClubsAvailableSpots(affectedClubIds);

        return mapToResponse(updated);
    }

    /**
     * Deactivates a child and removes it from its clubs.
     *
     * @param id child ID
     * @throws EntityNotFoundException if it does not exist
     */
    @Transactional
    public void delete(Long id) {
        Child child = childRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Child record not found with ID: " + id));
        Set<Long> affectedClubIds = new HashSet<>();
        if (child.getChildClubs() != null) {
            child.getChildClubs().forEach(childClub -> affectedClubIds.add(childClub.getClub().getId()));
        }

        child.getChildClubs().clear();
        child.setIsActive(false);
        childClubRepository.flush();

        updateClubsAvailableSpots(affectedClubIds);
    }

    /**
     * @return active children as options for a select field, labeled with their student ID and name
     */
    @Transactional(readOnly = true)
    public List<ChildOptionResponse> getChildrenOptions() {
        return childRepository.findAll()
                .stream()
                .filter(child -> Boolean.TRUE.equals(child.getIsActive()))
                .map(child -> new ChildOptionResponse(
                        child.getId(),
                        child.getStudentId(),
                        child.getStudentId() + " - " + child.getFirstName() + " " + child.getLastName()))
                .toList();
    }

    /**
     * @return children who do not have a student record yet
     */
    @Transactional(readOnly = true)
    public List<ChildResponse> getAvailableChildrenForExpedient() {
        return childRepository.findAvailableChildrenForExpedient().stream()
                .map(this::mapToResponse)
                .toList();
    }

    private ChildResponse mapToResponse(Child child) {
        Set<String> clubNames = child.getChildClubs() != null
                ? child.getChildClubs().stream()
                        .map(childClub -> childClub.getClub().getName())
                        .collect(Collectors.toSet())
                : Set.of();

        String parentFullName = child.getParent() != null
                ? child.getParent().getFirstName() + " " + child.getParent().getLastName()
                : null;

        ChildResponse response = new ChildResponse();
        response.setId(child.getId());
        response.setStudentId(child.getStudentId());
        response.setParentIdentification(child.getParent() != null ? child.getParent().getIdentification() : null);
        response.setParentName(parentFullName);
        response.setRelationship(child.getRelationship());
        response.setFirstName(child.getFirstName());
        response.setLastName(child.getLastName());
        response.setBirthDate(child.getBirthDate());
        response.setMedicalNotes(child.getMedicalNotes());
        response.setIsActive(child.getIsActive());
        response.setClubNames(clubNames);

        return response;
    }

    /**
     * Recalculates the free spots of clubs from their current enrollments.
     *
     * @param clubIds clubs to update, may be empty
     */
    private void updateClubsAvailableSpots(Set<Long> clubIds) {
        if (clubIds == null || clubIds.isEmpty())
            return;

        List<Club> clubs = clubRepository.findAllById(clubIds);
        for (Club club : clubs) {
            if (club.getMaxCapacity() != null) {
                long enrolled = childClubRepository.countByClubId(club.getId());
                int available = (int) Math.max(0, club.getMaxCapacity() - enrolled);
                club.setAvailableSpots(available);
            }
        }
        clubRepository.saveAll(clubs);
    }
}