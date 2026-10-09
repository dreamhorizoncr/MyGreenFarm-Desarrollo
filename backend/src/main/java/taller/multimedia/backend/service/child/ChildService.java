package taller.multimedia.backend.service.child;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.child.ChildOptionResponse;
import taller.multimedia.backend.dto.child.ChildRequest;
import taller.multimedia.backend.dto.child.ChildResponse;
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

@Service
@RequiredArgsConstructor
public class ChildService {

    private final ChildRepository childRepository;
    private final ParentRepository parentRepository;
    private final ClubRepository clubRepository;
    private final ChildClubRepository childClubRepository;
    private final StudentIdGeneratorService studentIdGeneratorService;

    @Transactional
    public ChildResponse create(ChildRequest dto) {
        String parentIdentification = Sanitizer.requireClean("parentIdentification", dto.getParentIdentification());

        Parent parent = parentRepository.findByIdentification(parentIdentification)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Padre/Tutor no encontrado con la cédula: " + parentIdentification));

        String firstName = Sanitizer.requireClean("firstName", dto.getFirstName());
        String lastName = Sanitizer.requireClean("lastName", dto.getLastName());
        String medicalNotes = dto.getMedicalNotes() == null ? null
                : Sanitizer.requireCleanPreserveLineBreaks("medicalNotes", dto.getMedicalNotes());

        String studentId = studentIdGeneratorService.generateNextStudentId();

        Child child = Child.builder()
                .studentId(studentId)
                .parent(parent)
                .relationship(dto.getRelationship())
                .firstName(firstName)
                .lastName(lastName)
                .birthDate(dto.getBirthDate())
                .medicalNotes(medicalNotes)
                .childClubs(new ArrayList<>())
                .build();

        Set<Long> affectedClubIds = new HashSet<>();

        if (dto.getClubIds() != null && !dto.getClubIds().isEmpty()) {
            List<Club> clubs = clubRepository.findAllById(dto.getClubIds());
            for (Club club : clubs) {
                long enrolled = childClubRepository.countByClubId(club.getId());
                if (club.getMaxCapacity() != null && enrolled >= club.getMaxCapacity()) {
                    throw new IllegalArgumentException(
                            "El club '" + club.getName() + "' ya no tiene cupos disponibles.");
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

    @Transactional(readOnly = true)
    public Page<ChildResponse> getAll(Pageable pageable) {
        return childRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<ChildResponse> getByParentId(Long parentId, Pageable pageable) {
        return childRepository.findByParentId(parentId, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public ChildResponse getById(Long id) {
        Child child = childRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Registro de niño no encontrado con ID: " + id));
        return mapToResponse(child);
    }

    @Transactional
    public ChildResponse update(Long id, ChildRequest dto) {
        Child child = childRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Registro de niño no encontrado con ID: " + id));

        Parent parent = parentRepository.findByIdentification(dto.getParentIdentification())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Padre/Tutor no encontrado con la cédula: " + dto.getParentIdentification()));

        String firstName = Sanitizer.requireClean("firstName", dto.getFirstName());
        String lastName = Sanitizer.requireClean("lastName", dto.getLastName());
        String medicalNotes = dto.getMedicalNotes() == null ? null
                : Sanitizer.requireCleanPreserveLineBreaks("medicalNotes", dto.getMedicalNotes());

        Set<Long> affectedClubIds = new HashSet<>();

        Set<Long> targetClubIds = dto.getClubIds() != null ? new HashSet<>(dto.getClubIds()) : new HashSet<>();

        List<ChildClub> currentChildClubs = childClubRepository.findByChildId(child.getId());

        // Mapear los IDs de los clubes que el niño tiene actualmente
        Set<Long> existingClubIds = currentChildClubs.stream()
                .map(cc -> cc.getClub().getId())
                .collect(Collectors.toSet());

        affectedClubIds.addAll(existingClubIds);

        // 4. ELIMINAR solo las relaciones que el usuario desmarcó
        List<ChildClub> toRemove = currentChildClubs.stream()
                .filter(cc -> !targetClubIds.contains(cc.getClub().getId()))
                .toList();

        if (!toRemove.isEmpty()) {
            childClubRepository.deleteAll(toRemove);
            childClubRepository.flush(); // Se fuerza la eliminación inmediata en Postgres
        }

        // 5. INSERTAR solo los clubes verdaderamente NUEVOS
        Set<Long> newClubIds = targetClubIds.stream()
                .filter(clubId -> !existingClubIds.contains(clubId))
                .collect(Collectors.toSet());

        if (!newClubIds.isEmpty()) {
            List<Club> newClubs = clubRepository.findAllById(newClubIds);
            List<ChildClub> newChildClubs = new ArrayList<>();

            for (Club club : newClubs) {
                // Validar si hay cupo en el club nuevo
                long enrolled = childClubRepository.countByClubId(club.getId());
                if (club.getMaxCapacity() != null && enrolled >= club.getMaxCapacity()) {
                    throw new IllegalArgumentException(
                            "El club '" + club.getName() + "' ya no tiene cupos disponibles.");
                }

                ChildClub cc = new ChildClub();
                cc.setChild(child);
                cc.setClub(club);
                newChildClubs.add(cc);

                affectedClubIds.add(club.getId());
            }

            childClubRepository.saveAll(newChildClubs);
        }

        child.setParent(parent);
        child.setRelationship(dto.getRelationship());
        child.setFirstName(firstName);
        child.setLastName(lastName);
        child.setBirthDate(dto.getBirthDate());
        child.setMedicalNotes(medicalNotes);

        Child updated = childRepository.save(child);
        updateClubsAvailableSpots(affectedClubIds);

        return mapToResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        Child child = childRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Registro de niño no encontrado con ID: " + id));
        Set<Long> affectedClubIds = new HashSet<>();
        if (child.getChildClubs() != null) {
            child.getChildClubs().forEach(cc -> affectedClubIds.add(cc.getClub().getId()));
        }

        childRepository.delete(child);

        // Recalcular los cupos disponibles tras eliminar al niño
        updateClubsAvailableSpots(affectedClubIds);
    }

    @Transactional(readOnly = true)
    public List<ChildOptionResponse> getChildrenOptions() {
        return childRepository.findAll()
                .stream()
                .map(child -> new ChildOptionResponse(
                        child.getId(),
                        child.getStudentId(),
                        child.getStudentId() + " - " + child.getFirstName() + " " + child.getLastName()))
                .toList();
    }

    private ChildResponse mapToResponse(Child child) {
        Set<String> clubNames = child.getChildClubs() != null
                ? child.getChildClubs().stream()
                        .map(cc -> cc.getClub().getName())
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
        response.setClubNames(clubNames);

        return response;
    }

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