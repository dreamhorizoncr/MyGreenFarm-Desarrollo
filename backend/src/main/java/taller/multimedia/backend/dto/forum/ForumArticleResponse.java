package taller.multimedia.backend.dto.forum;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class ForumArticleResponse {

    private UUID id;
    private String title;
    private String topic;
    private String authorName;
    private String authorRole;
    private String content;
    private String imageUrl;
    private String imageAlt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer reactionCount;
    private boolean reacted;
    private long commentCount;
}
