package taller.multimedia.backend.repository.child;

import java.util.Collection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import taller.multimedia.backend.model.child.Child;

import java.util.List;
import java.util.Optional;

/**
 * Storage of enrolled children.
 */
public interface ChildRepository extends JpaRepository<Child, Long> {

    Page<Child> findByParentId(Long parentId, Pageable pageable);

    List<Child> findByParentId(Long parentId);

    Page<Child> findByIsActiveTrue(Pageable pageable);

    Page<Child> findByIsActive(Boolean isActive, Pageable pageable);

    /**
     * @param statuses {@code isActive} values to include: only true, only false, or both
     * @param pattern search pattern from {@link taller.multimedia.backend.util.SearchPattern}
     * @param pageable page to return
     * @return children whose full name, student ID, parent's name or medical notes contain the text
     */
    @Query("""
            SELECT c FROM Child c LEFT JOIN c.parent p WHERE c.isActive IN :statuses AND (
                LOWER(CONCAT(c.firstName, ' ', c.lastName)) LIKE :pattern ESCAPE '\\'
                OR LOWER(c.studentId) LIKE :pattern ESCAPE '\\'
                OR LOWER(CONCAT(p.firstName, ' ', p.lastName)) LIKE :pattern ESCAPE '\\'
                OR LOWER(COALESCE(c.medicalNotes, '')) LIKE :pattern ESCAPE '\\')""")
    Page<Child> search(@Param("statuses") Collection<Boolean> statuses, @Param("pattern") String pattern, Pageable pageable);

    long countByIsActiveTrue();

    Page<Child> findByParentIdAndIsActiveTrue(Long parentId, Pageable pageable);

    /**
     * @param prefix student ID prefix followed by {@code %}, for example {@code A6%}
     * @return the highest student ID with that prefix, or {@code null} if there is none
     */
    @Query("SELECT c.studentId FROM Child c WHERE c.studentId LIKE :prefix ORDER BY c.studentId DESC LIMIT 1")
    String findLastStudentIdByPrefix(@Param("prefix") String prefix);
    
    Optional<Child> findByStudentId(String studentId);

    /**
     * @return active children who do not have a student record yet
     */
    @Query("SELECT c FROM Child c WHERE c.isActive = true AND c.studentId NOT IN (SELECT e.child.studentId FROM Expedient e)")
    List<Child> findAvailableChildrenForExpedient();
}
