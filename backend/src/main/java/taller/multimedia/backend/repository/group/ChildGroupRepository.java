package taller.multimedia.backend.repository.group;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.group.ChildGroup;

@Repository
public interface ChildGroupRepository extends JpaRepository<ChildGroup, Long> {

    List<ChildGroup> findByChildIdIn(Collection<Long> childIds);

    Optional<ChildGroup> findByGroupIdAndChildId(Long groupId, Long childId);
}
