package taller.multimedia.backend.repository.children;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.children.Children;

import java.util.List;

@Repository
public interface ChildrenRepository extends JpaRepository<Children, Long> {

    Page<Children> findByParentId(Long parentId, Pageable pageable);

    // Búsqueda en lista simple por el ID del encargado/padre
    List<Children> findByParentId(Long parentId);
}
