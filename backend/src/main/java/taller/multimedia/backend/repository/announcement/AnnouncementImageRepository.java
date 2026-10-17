package taller.multimedia.backend.repository.announcement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import taller.multimedia.backend.model.announcement.AnnouncementImage;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnnouncementImageRepository extends JpaRepository<AnnouncementImage, UUID> {
    List<AnnouncementImage> findByAnnouncementId(UUID announcement);

    Optional<AnnouncementImage> findByAnnouncementIdAndIsCoverTrue(UUID announcement);
}
