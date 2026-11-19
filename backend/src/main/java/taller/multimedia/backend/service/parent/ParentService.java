package taller.multimedia.backend.service.parent;

import taller.multimedia.backend.util.SearchPattern;
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

/**
 * Parents or guardians of the enrolled children. Deleting a parent deactivates it instead of
 * removing the row.
 */
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

    /**
     * @param request parent data; texts are sanitized and the identification is normalized
     * @return the created parent, active unless the request says otherwise
     * @throws InvalidFieldException if the email is invalid, not from an allowed provider or
     *     already used, or a field is unsafe
     */
    public Parent createParent(ParentRequest request) {
        String cleanEmail = sanitizeEmail(request.getEmail());

        if (parentRepository.findByEmail(cleanEmail).isPresent()) {
            throw new InvalidFieldException(EMAIL_FIELD, "A parent with this email already exists.");
        }

        Parent parent = new Parent();
        parent.setIdentification(normalizeIdentification(Sanitizer.requireClean("identification", request.getIdentification())));
        parent.setEmail(cleanEmail);
        parent.setPhoneNumber(Sanitizer.requireClean("phoneNumber", request.getPhoneNumber()));
        parent.setAddress(Sanitizer.requireClean("address", request.getAddress()));
        parent.setFirstName(Sanitizer.requireClean("firstName", request.getFirstName()));
        parent.setLastName(Sanitizer.requireClean("lastName", request.getLastName()));
        parent.setLanguage(resolveLanguageCode(request.getLanguage()));
        parent.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

        return parentRepository.save(parent);
    }

    /**
     * @param pageable page to return
     * @return active parents only
     */
    public Page<Parent> getAllParents(Pageable pageable) {
        return getAllParents(pageable, null);
    }

    /**
     * @param pageable page to return
     * @param search text to look for in the name, identification, email and phone, optional
     * @return active parents, filtered by the text when there is one
     */
    public Page<Parent> getAllParents(Pageable pageable, String search) {
        return SearchPattern.of(search)
                .map(pattern -> parentRepository.searchActive(pattern, pageable))
                .orElseGet(() -> parentRepository.findByIsActiveTrue(pageable));
    }

    /**
     * Removes spaces and hyphens from numeric identifications (for example {@code 1-2345-6789}
     * becomes {@code 123456789}). Identifications with letters, such as passports, are only
     * trimmed.
     *
     * @param identification identification as typed
     * @return the normalized identification, or an empty string for {@code null}
     */
    static String normalizeIdentification(String identification) {
        String trimmed = identification == null ? "" : identification.trim();
        return trimmed.matches("[\\d\\s-]+") ? trimmed.replaceAll("\\D", "") : trimmed;
    }

    /**
     * @param lang language code from the form
     * @return {@code en}, {@code fr} or {@code es} (the default)
     */
    private String resolveLanguageCode(String lang) {
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

    /**
     * Lowercases an email and checks that it comes from an allowed provider (Gmail, Hotmail,
     * Outlook or UCR).
     *
     * @param email address entered in the form
     * @return the cleaned email
     * @throws InvalidFieldException if the email is missing, malformed or from another domain
     */
    private String sanitizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new InvalidFieldException(EMAIL_FIELD, "The email is required.");
        }

        String cleanEmail = email.toLowerCase().trim();

        if (!cleanEmail.contains("@") || !cleanEmail.contains(".")) {
            throw new InvalidFieldException(EMAIL_FIELD, "The email format is not valid.");
        }

        String domain = cleanEmail.substring(cleanEmail.lastIndexOf("@") + 1);

        if (domain.isBlank() || !domain.contains(".")) {
            throw new InvalidFieldException(EMAIL_FIELD, "The email domain is not valid.");
        }

        List<String> allowedDomains = List.of(
                "gmail.com",
                "hotmail.com",
                "outlook.com",
                "ucr.ac.cr");

        if (!allowedDomains.contains(domain)) {
            throw new InvalidFieldException(EMAIL_FIELD,
                    "Only common email providers are allowed (Gmail, Hotmail, Outlook, etc.).");
        }

        List<String> blockedDomains = List.of(
                "mailinator.com",
                "yopmail.com",
                "tempmail.com",
                "test.com",
                "example.com");

        if (blockedDomains.contains(domain)) {
            throw new InvalidFieldException(EMAIL_FIELD, "Temporary or test email addresses are not allowed.");
        }

        return cleanEmail;
    }

    /**
     * @param id parent ID
     * @return the parent, active or not
     * @throws RuntimeException if it does not exist
     */
    public Parent getParentById(Integer id) {
        return parentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No parent was found with the given ID."));
    }

    /**
     * @param id parent ID
     * @param request new data; {@code isActive} is only changed when it is sent
     * @return the updated parent
     * @throws RuntimeException if the parent does not exist
     * @throws InvalidFieldException if the email belongs to another parent or a field is invalid
     */
    public Parent updateParent(Integer id, ParentRequest request) {
        Parent existingParent = getParentById(id);

        parentRepository.findByEmail(request.getEmail()).ifPresent(parent -> {
            if (!parent.getId().equals(id)) {
                throw new InvalidFieldException(EMAIL_FIELD, "Another parent with this email already exists.");
            }
        });

        existingParent.setIdentification(normalizeIdentification(Sanitizer.requireClean("identification", request.getIdentification())));
        existingParent.setEmail(sanitizeEmail(request.getEmail()));
        existingParent.setPhoneNumber(Sanitizer.requireClean("phoneNumber", request.getPhoneNumber()));
        existingParent.setAddress(Sanitizer.requireClean("address", request.getAddress()));
        existingParent.setFirstName(Sanitizer.requireClean("firstName", request.getFirstName()));
        existingParent.setLastName(Sanitizer.requireClean("lastName", request.getLastName()));

        existingParent.setLanguage(resolveLanguageCode(request.getLanguage()));

        if (request.getIsActive() != null) {
            existingParent.setIsActive(request.getIsActive());
        }

        return parentRepository.save(existingParent);
    }

    /**
     * Deactivates a parent and their children, removes the children from their clubs and
     * recalculates the free spots of those clubs.
     *
     * @param id parent ID
     * @throws RuntimeException if the parent does not exist
     */
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

    /**
     * Unsubscribes a parent from the newsletter. Parents receive it while they are active, so this
     * deactivates the parent.
     *
     * @param email parent's email
     * @throws InvalidFieldException if the email is invalid
     * @throws RuntimeException if no parent has that email
     */
    public void unsubscribeFromNewsletter(String email) {
        String cleanEmail = sanitizeEmail(email);
        Parent parent = parentRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("The parent is not registered."));

        if (parent.isActiveForNewsletter()) {
            parent.setIsActive(false);
            parentRepository.save(parent);
        }
    }
}