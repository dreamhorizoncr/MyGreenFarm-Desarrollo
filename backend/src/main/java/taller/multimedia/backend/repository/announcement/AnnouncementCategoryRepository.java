package taller.multimedia.backend.repository.announcement;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import taller.multimedia.backend.model.announcement.AnnouncementCategory;

/**
 * Storage of announcement categories.
 */
public interface AnnouncementCategoryRepository extends JpaRepository<AnnouncementCategory, UUID> {
    List<AnnouncementCategory> findAllByOrderByPositionAscTitleAsc();

    /**
     * @param code legacy announcement type, for example {@code NEWS}
     * @return the category created for that type, if any
     */
    Optional<AnnouncementCategory> findByCode(String code);

    boolean existsByTitleIgnoreCase(String title);

    /**
     * @return the highest position in use, or -1 when there are no categories
     */
    @Query("SELECT COALESCE(MAX(c.position), -1) FROM AnnouncementCategory c")
    int findMaxPosition();
}
