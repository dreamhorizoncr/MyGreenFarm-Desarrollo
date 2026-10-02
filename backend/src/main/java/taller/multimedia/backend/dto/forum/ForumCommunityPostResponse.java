package taller.multimedia.backend.dto.forum;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class ForumCommunityPostResponse {

    private UUID id;
    private String name;
    private String content;
    private LocalDateTime createdAt;
    private int reactionCount;
    private long commentCount;
}
