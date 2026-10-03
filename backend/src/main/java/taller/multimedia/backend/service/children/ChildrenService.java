package taller.multimedia.backend.service.children;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.children.ChildrenRequest;
import taller.multimedia.backend.dto.children.ChildrenResponse;
import taller.multimedia.backend.model.children.Children;
import taller.multimedia.backend.model.club.Club;
import taller.multimedia.backend.model.parent.Parent;
import taller.multimedia.backend.repository.children.ChildrenRepository;
import taller.multimedia.backend.repository.club.ClubRepository;
import taller.multimedia.backend.repository.parent.ParentRepository;
import taller.multimedia.backend.util.Sanitizer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChildrenService {

    private final ChildrenRepository childrenRepository;
    private final ParentRepository parentRepository;
    private final ClubRepository clubRepository;

    @Transactional
    public ChildrenResponse create(ChildrenRequest dto) {
        Parent parent = parentRepository.findById(dto.getParentId().intValue())
                .orElseThrow(() -> new EntityNotFoundException("Padre/Tutor no encontrado con ID: " + dto.getParentId()));

        String firstName = Sanitizer.requireClean("firstName", dto.getFirstName());
        String lastName = Sanitizer.requireClean("lastName", dto.getLastName());
        String medicalNotes = dto.getMedicalNotes() == null ? null : Sanitizer.requireCleanPreserveLineBreaks("medicalNotes", dto.getMedicalNotes());

        Set<Club> clubs = new HashSet<>();
        if (dto.getClubIds() != null && !dto.getClubIds().isEmpty()) {
            clubs = new HashSet<>(clubRepository.findAllById(dto.getClubIds()));
        }

        Children child = Children.builder()
                .parent(parent)
                .relationship(dto.getRelationship())
                .firstName(firstName)
                .lastName(lastName)
                .birthDate(dto.getBirthDate())
                .medicalNotes(medicalNotes)
                .clubs(clubs)
                .build();

        Children saved = childrenRepository.save(child);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<ChildrenResponse> getAll(Pageable pageable) {
        return childrenRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<ChildrenResponse> getByParentId(Long parentId, Pageable pageable) {
        return childrenRepository.findByParentId(parentId, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public ChildrenResponse getById(Long id) {
        Children child = childrenRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Registro de niño no encontrado con ID: " + id));
        return mapToResponse(child);
    }

    @Transactional
    public ChildrenResponse update(Long id, ChildrenRequest dto) {
        Children child = childrenRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Registro de niño no encontrado con ID: " + id));

        Parent parent = parentRepository.findById(dto.getParentId().intValue())
                .orElseThrow(() -> new EntityNotFoundException("Padre/Tutor no encontrado con ID: " + dto.getParentId()));

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

        Children updated = childrenRepository.save(child);
        return mapToResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        Children child = childrenRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Registro de niño no encontrado con ID: " + id));
        childrenRepository.delete(child);
    }

    private ChildrenResponse mapToResponse(Children child) {
        Set<String> clubNames = child.getClubs().stream()
                .map(Club::getName)
                .collect(Collectors.toSet());

        String parentFullName = child.getParent() != null 
                ? child.getParent().getFirstName() + " " + child.getParent().getLastName()
                : null;

        ChildrenResponse response = new ChildrenResponse();
        response.setId(child.getId());
        response.setParentId(child.getParent() != null ? child.getParent().getId() : null);
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
