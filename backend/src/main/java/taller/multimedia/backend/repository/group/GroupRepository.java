package taller.multimedia.backend.repository.group;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import java.util.UUID;

import taller.multimedia.backend.model.group.Group;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {

    @Query("SELECT DISTINCT g FROM Group g LEFT JOIN FETCH g.children WHERE g.id = :id")
    Optional<Group> findByIdWithChildren(@Param("id") Long id);

    @Query("SELECT DISTINCT g FROM Group g LEFT JOIN FETCH g.children")
    List<Group> findAllWithChildren();

    @Query("SELECT g FROM Group g WHERE g.teacherUser.id = :teacherUserId")
    List<Group> findByTeacherUserId(@Param("teacherUserId") UUID teacherUserId);
}
