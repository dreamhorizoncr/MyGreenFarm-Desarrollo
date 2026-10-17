package taller.multimedia.backend.repository.announcement;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.announcement.AnnouncementCategory;

@Repository
public interface AnnouncementCategoryRepository extends JpaRepository<AnnouncementCategory, UUID> {
    List<AnnouncementCategory> findAllByOrderByPositionAscTitleAsc();

    Optional<AnnouncementCategory> findByCode(String code);

    boolean existsByTitleIgnoreCase(String title);

    @Query("SELECT COALESCE(MAX(c.position), -1) FROM AnnouncementCategory c")
    int findMaxPosition();
}
