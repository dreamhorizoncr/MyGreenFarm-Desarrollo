package taller.multimedia.backend.repository.group;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.group.TeacherGroup;

@Repository
public interface TeacherGroupRepository extends JpaRepository<TeacherGroup, Long> {

    /** Removes the teacher from every group they are assigned to; the groups themselves are kept. */
    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM TeacherGroup tg WHERE tg.teacher.id = :teacherId")
    int deleteByTeacherId(@Param("teacherId") UUID teacherId);
}
