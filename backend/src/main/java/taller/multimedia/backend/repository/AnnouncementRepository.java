package taller.multimedia.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.announcement.Announcement;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, UUID>{
    List<Announcement> findByCreatedAtAfter(LocalDateTime date);
}
