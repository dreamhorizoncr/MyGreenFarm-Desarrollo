package taller.multimedia.backend.model.announcement;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "announcement_images")
@Data
public class AnnouncementImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "is_cover", nullable = false)
    private Boolean isCover;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "announcement_id", nullable = false)
    private Announcement announcement;

    public UUID getId() {
        return id;
    }

    public Boolean getIsCover() {
        return isCover;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public Announcement getAnnouncement() {
        return announcement;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setIsCover(Boolean isCover) {
        this.isCover = isCover;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public void setAnnouncement(Announcement announcement) {
        this.announcement = announcement;
    }
}