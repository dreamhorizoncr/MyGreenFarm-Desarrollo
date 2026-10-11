package taller.multimedia.backend.repository.child;

import taller.multimedia.backend.model.child.ChildClub;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository 
public interface ChildClubRepository extends JpaRepository<ChildClub, Long> {
    long countByClubId(Long clubId);
    void deleteByClubId(Long clubId);
    void deleteByChildId(Long childId);
    List<ChildClub> findByChildId(Long childId);
}