package taller.multimedia.backend.repository.parent;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import taller.multimedia.backend.model.parent.Parent;
import taller.multimedia.backend.repository.newsletter.SubscriberEmailProjection;

import java.util.List;
import java.util.Optional;

/**
 * Storage of parents and guardians.
 */
public interface ParentRepository extends JpaRepository<Parent, Integer> {

    Optional<Parent> findByEmail(String email);

    boolean existsByEmailAndIsActiveTrue(String email);

    /**
     * @return emails of the active parents
     */
    @Query("SELECT p.email FROM Parent p WHERE p.isActive = true")
    List<String> findAllActiveParentEmails();

    /**
     * @return email and language of the active parents, who receive the newsletter
     */
    @Query("SELECT p.email as email, p.language as language FROM Parent p WHERE p.isActive = true")
    List<SubscriberEmailProjection> findAllActiveParentsInfo();

    Optional<Parent> findByIdentification(String identification);

    Page<Parent> findByIsActiveTrue(Pageable pageable);

    /**
     * @param pattern search pattern from {@link taller.multimedia.backend.util.SearchPattern}
     * @param pageable page to return
     * @return active parents whose full name, identification, email or phone contain the text
     */
    @Query("""
            SELECT p FROM Parent p WHERE p.isActive = true AND (
                LOWER(CONCAT(p.firstName, ' ', p.lastName)) LIKE :pattern ESCAPE '\\'
                OR LOWER(p.identification) LIKE :pattern ESCAPE '\\'
                OR LOWER(p.email) LIKE :pattern ESCAPE '\\'
                OR LOWER(p.phoneNumber) LIKE :pattern ESCAPE '\\')""")
    Page<Parent> searchActive(@Param("pattern") String pattern, Pageable pageable);
}
