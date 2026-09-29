package taller.multimedia.backend.dto.forum;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class ForumCommentResponse {

    private UUID id;
    private UUID articleId;
    private String alias;
    private String content;
    private LocalDateTime createdAt;
}
