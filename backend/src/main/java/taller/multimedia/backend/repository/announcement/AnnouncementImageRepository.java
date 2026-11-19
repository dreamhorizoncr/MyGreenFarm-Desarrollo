package taller.multimedia.backend.repository.announcement;

import org.springframework.data.jpa.repository.JpaRepository;
import taller.multimedia.backend.model.announcement.AnnouncementImage;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Storage of announcement images.
 */
public interface AnnouncementImageRepository extends JpaRepository<AnnouncementImage, UUID> {
    List<AnnouncementImage> findByAnnouncementId(UUID announcementId);

    Optional<AnnouncementImage> findByAnnouncementIdAndIsCoverTrue(UUID announcementId);
}
