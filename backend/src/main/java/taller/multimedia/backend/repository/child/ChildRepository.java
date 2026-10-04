package taller.multimedia.backend.repository.child;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.child.Child;

import java.util.List;

@Repository
public interface ChildRepository extends JpaRepository<Child, Long> {

    Page<Child> findByParentId(Long parentId, Pageable pageable);

    // Búsqueda en lista simple por el ID del encargado/padre
    List<Child> findByParentId(Long parentId);

    @Query("SELECT c.studentId FROM Child c WHERE c.studentId LIKE :prefix ORDER BY c.studentId DESC LIMIT 1")
    String findLastStudentIdByPrefix(@Param("prefix") String prefix);

    @Query("SELECT c FROM Child c WHERE c.id NOT IN (SELECT e.child.id FROM Expedient e)")
    List<Child> findAllWithoutExpedient();
    
}
