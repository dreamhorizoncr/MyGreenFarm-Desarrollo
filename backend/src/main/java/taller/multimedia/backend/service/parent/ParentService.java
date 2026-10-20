package taller.multimedia.backend.service.parent;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import taller.multimedia.backend.dto.parent.ParentRequest;
import taller.multimedia.backend.model.parent.Parent;
import taller.multimedia.backend.repository.parent.ParentRepository;
import taller.multimedia.backend.repository.child.ChildClubRepository;
import taller.multimedia.backend.repository.child.ChildRepository;
import taller.multimedia.backend.model.child.Child;
import taller.multimedia.backend.model.club.Club;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashSet;
import java.util.Set;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.util.Sanitizer;

import java.util.List;

@Service
public class ParentService {

    private static final String EMAIL_FIELD = "email";

    private final ParentRepository parentRepository;
    private final ChildRepository childRepository;
    private final ChildClubRepository childClubRepository;

    public ParentService(ParentRepository parentRepository, ChildRepository childRepository,
            ChildClubRepository childClubRepository) {
        this.parentRepository = parentRepository;
        this.childRepository = childRepository;
        this.childClubRepository = childClubRepository;
    }

    public Parent createParent(ParentRequest dto) {
        String cleanEmail = sanitizeEmail(dto.getEmail());

        if (parentRepository.findByEmail(cleanEmail).isPresent()) {
            throw new InvalidFieldException(EMAIL_FIELD, "Ya existe un padre registrado con este correo.");
        }

        Parent parent = new Parent();
        parent.setIdentification(normalizeIdentification(Sanitizer.requireClean("identification", dto.getIdentification())));
        parent.setEmail(cleanEmail);
        parent.setPhoneNumber(Sanitizer.requireClean("phoneNumber", dto.getPhoneNumber()));
        parent.setAddress(Sanitizer.requireClean("address", dto.getAddress()));
        parent.setFirstName(Sanitizer.requireClean("firstName", dto.getFirstName()));
        parent.setLastName(Sanitizer.requireClean("lastName", dto.getLastName()));
        parent.setLanguage(resolverLangCode(dto.getLanguage()));
        parent.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        return parentRepository.save(parent);
    }

    public Page<Parent> getAllParents(Pageable pageable) {
        return parentRepository.findByIsActiveTrue(pageable);
    }

    // Cédula o DIMEX escritos con guiones o espacios se guardan solo con dígitos; un pasaporte queda igual
    static String normalizeIdentification(String identification) {
        String trimmed = identification == null ? "" : identification.trim();
        return trimmed.matches("[\\d\\s-]+") ? trimmed.replaceAll("\\D", "") : trimmed;
    }

    private String resolverLangCode(String lang) {
        if (lang == null || lang.isBlank()) {
            return "es";
        }
        String normalized = lang.toLowerCase().trim();
        if (normalized.startsWith("en"))
            return "en";
        if (normalized.startsWith("fr"))
            return "fr";
        return "es";
    }

    private String sanitizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new InvalidFieldException(EMAIL_FIELD, "El correo electrónico es obligatorio.");
        }

        String cleanEmail = email.toLowerCase().trim();

        if (!cleanEmail.contains("@") || !cleanEmail.contains(".")) {
            throw new InvalidFieldException(EMAIL_FIELD, "El formato del correo electrónico no es válido.");
        }

        String domain = cleanEmail.substring(cleanEmail.lastIndexOf("@") + 1);

        if (domain.isBlank() || !domain.contains(".")) {
            throw new InvalidFieldException(EMAIL_FIELD, "El dominio del correo no es válido.");
        }

        List<String> allowedDomains = List.of(
                "gmail.com",
                "hotmail.com",
                "outlook.com",
                "ucr.ac.cr");

        if (!allowedDomains.contains(domain)) {
            throw new InvalidFieldException(EMAIL_FIELD,
                    "Solo se permiten correos de proveedores comunes (Gmail, Hotmail, Outlook, etc.).");
        }

        List<String> blockedDomains = List.of(
                "mailinator.com",
                "yopmail.com",
                "tempmail.com",
                "test.com",
                "example.com");

        if (blockedDomains.contains(domain)) {
            throw new InvalidFieldException(EMAIL_FIELD, "No se permiten correos temporales o de prueba.");
        }

        return cleanEmail;
    }

    public Parent getParentById(Integer id) {
        return parentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No se encontró ningún padre con el ID proporcionado."));
    }

    public Parent updateParent(Integer id, ParentRequest dto) {
        Parent existingParent = getParentById(id);

        parentRepository.findByEmail(dto.getEmail()).ifPresent(parent -> {
            if (!parent.getId().equals(id)) {
                throw new InvalidFieldException(EMAIL_FIELD, "Ya existe otro padre registrado con este correo.");
            }
        });

        existingParent.setIdentification(normalizeIdentification(Sanitizer.requireClean("identification", dto.getIdentification())));
        existingParent.setEmail(sanitizeEmail(dto.getEmail()));
        existingParent.setPhoneNumber(Sanitizer.requireClean("phoneNumber", dto.getPhoneNumber()));
        existingParent.setAddress(Sanitizer.requireClean("address", dto.getAddress()));
        existingParent.setFirstName(Sanitizer.requireClean("firstName", dto.getFirstName()));
        existingParent.setLastName(Sanitizer.requireClean("lastName", dto.getLastName()));

        existingParent.setLanguage(resolverLangCode(dto.getLanguage()));

        if (dto.getIsActive() != null) {
            existingParent.setIsActive(dto.getIsActive());
        }

        return parentRepository.save(existingParent);
    }

    @Transactional
    public void deleteParent(Integer id) {
        Parent parent = getParentById(id);
        List<Child> children = childRepository.findByParentId(parent.getId().longValue());
        Set<Club> affectedClubs = new HashSet<>();

        for (Child child : children) {
            child.getChildClubs().forEach(childClub -> affectedClubs.add(childClub.getClub()));
            child.getChildClubs().clear();
            child.setIsActive(false);
        }

        childClubRepository.flush();
        parent.setIsActive(false);

        affectedClubs.forEach(club -> {
            long enrolled = childClubRepository.countByClubId(club.getId());
            if (club.getMaxCapacity() != null) {
                club.setAvailableSpots((int) Math.max(0, club.getMaxCapacity() - enrolled));
            }
        });
    }

    public void unsubscribeFromNewsletter(String email) {
        String cleanEmail = sanitizeEmail(email);
        Parent parent = parentRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("El padre no se encuentra registrado."));

        if (parent.isActiveForNewsletter()) {
            parent.setIsActive(false);
            parentRepository.save(parent);
        }
    }
}