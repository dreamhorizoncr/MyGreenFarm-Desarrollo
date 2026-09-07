package taller.multimedia.backend.dto.announcement;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnnouncementImageResponse {
    private UUID id;
    private UUID announcementId;
    private String fileUrl;

    @JsonProperty("isCover")
    private boolean isCover;
}
