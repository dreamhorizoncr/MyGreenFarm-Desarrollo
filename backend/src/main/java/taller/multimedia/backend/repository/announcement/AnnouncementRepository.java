package taller.multimedia.backend.repository.announcement;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.announcement.Announcement;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, UUID>{
    Page<Announcement> findByCreatedAtAfter(LocalDateTime date, Pageable pageable);

    List<Announcement> findByCreatedAtBefore(LocalDateTime dateTime);

    boolean existsByTitle(String title);

    boolean existsByTitleAndIdNot(String title, UUID id);

}
