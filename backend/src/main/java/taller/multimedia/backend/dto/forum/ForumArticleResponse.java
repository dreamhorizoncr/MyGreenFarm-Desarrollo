package taller.multimedia.backend.dto.forum;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * A forum article with its likes, comment count and whether the current visitor liked it. The
 * author fields are empty when the author was deleted.
 */
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
    private String aiSummary;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer reactionCount;
    private boolean reacted;
    private long commentCount;
}
