package taller.multimedia.backend.repository.group;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

import java.util.UUID;

import taller.multimedia.backend.model.group.Group;

/**
 * Storage of class groups.
 */
public interface GroupRepository extends JpaRepository<Group, Long> {

    /**
     * @param id group ID
     * @return the group with its children loaded in the same query
     */
    @Query("SELECT DISTINCT g FROM Group g LEFT JOIN FETCH g.childGroups cg LEFT JOIN FETCH cg.child WHERE g.id = :id")
    Optional<Group> findByIdWithChildren(@Param("id") Long id);

    /**
     * @return all groups with their children loaded in the same query
     */
    @Query("SELECT DISTINCT g FROM Group g LEFT JOIN FETCH g.childGroups cg LEFT JOIN FETCH cg.child")
    List<Group> findAllWithChildren();

    /**
     * @param teacherId teacher ID
     * @return the groups the teacher is assigned to
     */
    @Query("SELECT DISTINCT g FROM Group g JOIN g.teacherGroups tg WHERE tg.teacher.id = :teacherId")
    List<Group> findByTeacherId(@Param("teacherId") UUID teacherId);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
