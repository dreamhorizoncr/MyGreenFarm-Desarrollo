package taller.multimedia.backend.dto.forum;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;
@Data @Builder @AllArgsConstructor
public class ForumCommunityCommentResponse {
    private UUID id; private UUID communityPostId; private String alias; private String content; private LocalDateTime createdAt;
}
