package taller.multimedia.backend.repository.expedient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import taller.multimedia.backend.model.expedient.Expedient;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

/**
 * Storage of student records.
 */
public interface ExpedientRepository extends JpaRepository<Expedient, UUID> {

    Optional<Expedient> findByChildStudentId(String studentId);

    Optional<Expedient> findByChildId(Long childId);

    boolean existsByChildStudentId(String studentId);

    Page<Expedient> findByChildIsActiveTrue(Pageable pageable);

    /**
     * @param childIds children to include
     * @param pageable page and sort
     * @return the records of those children that are still active
     */
    @Query("SELECT e FROM Expedient e WHERE e.child.isActive = true AND e.child.id IN :childIds")
    Page<Expedient> findActiveByChildIds(@Param("childIds") Collection<Long> childIds, Pageable pageable);

    /**
     * @param pattern search pattern from {@link taller.multimedia.backend.util.SearchPattern}
     * @param pageable page to return
     * @return records of active children whose name, student ID or observations contain the text
     */
    @Query("""
            SELECT e FROM Expedient e WHERE e.child.isActive = true AND (
                LOWER(CONCAT(e.child.firstName, ' ', e.child.lastName)) LIKE :pattern ESCAPE '\\'
                OR LOWER(e.child.studentId) LIKE :pattern ESCAPE '\\'
                OR LOWER(COALESCE(e.generalObservations, '')) LIKE :pattern ESCAPE '\\')""")
    Page<Expedient> searchActive(@Param("pattern") String pattern, Pageable pageable);

    /**
     * @param childIds children the teacher may see
     * @param pattern search pattern from {@link taller.multimedia.backend.util.SearchPattern}
     * @param pageable page to return
     * @return the same as {@link #searchActive(String, Pageable)}, limited to those children
     */
    @Query("""
            SELECT e FROM Expedient e WHERE e.child.isActive = true AND e.child.id IN :childIds AND (
                LOWER(CONCAT(e.child.firstName, ' ', e.child.lastName)) LIKE :pattern ESCAPE '\\'
                OR LOWER(e.child.studentId) LIKE :pattern ESCAPE '\\'
                OR LOWER(COALESCE(e.generalObservations, '')) LIKE :pattern ESCAPE '\\')""")
    Page<Expedient> searchActiveByChildIds(@Param("childIds") Collection<Long> childIds, @Param("pattern") String pattern, Pageable pageable);
}
