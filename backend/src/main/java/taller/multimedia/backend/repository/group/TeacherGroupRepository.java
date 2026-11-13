package taller.multimedia.backend.repository.group;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import taller.multimedia.backend.model.group.TeacherGroup;

public interface TeacherGroupRepository extends JpaRepository<TeacherGroup, Long> {

    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM TeacherGroup tg WHERE tg.teacher.id = :teacherId")
    int deleteByTeacherId(@Param("teacherId") UUID teacherId);
}
