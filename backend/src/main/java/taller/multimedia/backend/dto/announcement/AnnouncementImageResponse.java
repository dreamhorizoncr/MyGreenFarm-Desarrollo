package taller.multimedia.backend.dto.announcement;

import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnnouncementImageResponse {
    private UUID id;
    private UUID announcementId;
    private String fileUrl;
    private boolean isCover;
}
