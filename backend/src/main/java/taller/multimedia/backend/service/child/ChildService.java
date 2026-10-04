package taller.multimedia.backend.service.child;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.child.ChildOptionResponse;
import taller.multimedia.backend.dto.child.ChildRequest;
import taller.multimedia.backend.dto.child.ChildResponse;
import taller.multimedia.backend.model.child.Child;
import taller.multimedia.backend.model.club.Club;
import taller.multimedia.backend.model.parent.Parent;
import taller.multimedia.backend.repository.child.ChildRepository;
import taller.multimedia.backend.repository.club.ClubRepository;
import taller.multimedia.backend.repository.parent.ParentRepository;
import taller.multimedia.backend.util.Sanitizer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final StudentIdGeneratorService studentIdGeneratorService;

    @Transactional
    public ChildResponse create(ChildRequest dto) {
        String parentIdentification = Sanitizer.requireClean("parentIdentification", dto.getParentIdentification());

        Parent parent = parentRepository.findByIdentification(parentIdentification)
                .orElseThrow(() -> new EntityNotFoundException("Padre/Tutor no encontrado con la cédula: " + parentIdentification));

        String firstName = Sanitizer.requireClean("firstName", dto.getFirstName());
        String lastName = Sanitizer.requireClean("lastName", dto.getLastName());
        String medicalNotes = dto.getMedicalNotes() == null ? null : Sanitizer.requireCleanPreserveLineBreaks("medicalNotes", dto.getMedicalNotes());

        String studentId = studentIdGeneratorService.generateNextStudentId();

        Set<Club> clubs = new HashSet<>();
        if (dto.getClubIds() != null && !dto.getClubIds().isEmpty()) {
            clubs = new HashSet<>(clubRepository.findAllById(dto.getClubIds()));
        }

        Child child = Child.builder()
                .studentId(studentId)
                .parent(parent)
                .relationship(dto.getRelationship())
                .firstName(firstName)
                .lastName(lastName)
                .birthDate(dto.getBirthDate())
                .medicalNotes(medicalNotes)
                .clubs(clubs)
                .build();

        Child saved = childRepository.save(child);
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
                .orElseThrow(() -> new EntityNotFoundException("Padre/Tutor no encontrado con ID: " + dto.getParentIdentification()));

        String firstName = Sanitizer.requireClean("firstName", dto.getFirstName());
        String lastName = Sanitizer.requireClean("lastName", dto.getLastName());
        String medicalNotes = dto.getMedicalNotes() == null ? null : Sanitizer.requireCleanPreserveLineBreaks("medicalNotes", dto.getMedicalNotes());

        Set<Club> clubs = new HashSet<>();
        if (dto.getClubIds() != null && !dto.getClubIds().isEmpty()) {
            clubs = new HashSet<>(clubRepository.findAllById(dto.getClubIds()));
        }

        child.setParent(parent);
        child.setRelationship(dto.getRelationship());
        child.setFirstName(firstName);
        child.setLastName(lastName);
        child.setBirthDate(dto.getBirthDate());
        child.setMedicalNotes(medicalNotes);
        child.setClubs(clubs);

        Child updated = childRepository.save(child);
        return mapToResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        Child child = childRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Registro de niño no encontrado con ID: " + id));
        childRepository.delete(child);
    }

    @Transactional(readOnly = true)
    public List<ChildOptionResponse> getChildrenOptions() {
        return childRepository.findAll()
                .stream()
                .map(child -> new ChildOptionResponse(
                        child.getId(),
                        child.getStudentId(),
                        child.getStudentId() + " - " + child.getFirstName() + " " + child.getLastName()
                ))
                .toList();
    }

    private ChildResponse mapToResponse(Child child) {
        Set<String> clubNames = child.getClubs().stream()
                .map(Club::getName)
                .collect(Collectors.toSet());

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
}
