package taller.multimedia.backend.repository.forum;

import java.util.UUID;

/**
 * Number of likes of one community post.
 */
public interface ForumPostLikeCountProjection {
    /**
     * @return post ID
     */
    UUID getPostId();

    /**
     * @return number of likes
     */
    Long getTotal();
}
