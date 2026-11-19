package taller.multimedia.backend.repository.forum;

import java.util.UUID;

/**
 * Number of likes of one forum article.
 */
public interface ForumArticleLikeCountProjection {

    /**
     * @return article ID
     */
    UUID getArticleId();

    /**
     * @return number of likes
     */
    Long getTotal();
}
