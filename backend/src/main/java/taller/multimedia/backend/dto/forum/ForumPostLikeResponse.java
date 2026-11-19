package taller.multimedia.backend.dto.forum;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Likes of a community post after a visitor liked or unliked it.
 */
@Data 
@AllArgsConstructor
public class ForumPostLikeResponse {
    private UUID communityPostId;
    private Integer totalLikes;
    private boolean liked;
}

