package taller.multimedia.backend.repository.announcement;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import taller.multimedia.backend.model.announcement.Announcement;

/**
 * Storage of announcements. Paged queries load the category in the same query to avoid N+1 queries.
 */
public interface AnnouncementRepository extends JpaRepository<Announcement, UUID>{
    /**
     * @param date oldest creation date
     * @param pageable page and sort
     * @return the announcements created after {@code date}, with their category
     */
    @EntityGraph(attributePaths = "category")
    Page<Announcement> findByCreatedAtAfter(LocalDateTime date, Pageable pageable);

    Page<Announcement> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime date, Pageable pageable);

    List<Announcement> findByCreatedAtBefore(LocalDateTime dateTime);

    boolean existsByTitle(String title);

    boolean existsByTitleAndIdNot(String title, UUID id);

    List<Announcement> findByCategoryId(UUID categoryId);

    @EntityGraph(attributePaths = "category")
    Page<Announcement> findByCategoryId(UUID categoryId, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = "category")
    Page<Announcement> findAll(Pageable pageable);

}
