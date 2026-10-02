package taller.multimedia.backend.dto.forum;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data 
@AllArgsConstructor
public class ForumPostLikeResponse {
    private UUID communityPostId;
    private Integer totalLikes;
    private boolean liked;
}

