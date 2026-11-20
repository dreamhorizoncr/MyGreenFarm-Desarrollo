package taller.multimedia.backend.repository.child;

import taller.multimedia.backend.model.child.ChildClub;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Storage of the enrollments of children in clubs.
 */
public interface ChildClubRepository extends JpaRepository<ChildClub, Long> {
    long countByClubId(Long clubId);
    void deleteByClubId(Long clubId);
    List<ChildClub> findByChildId(Long childId);
}