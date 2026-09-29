package taller.multimedia.backend.repository.forum;

import java.util.UUID;

public interface ForumArticleLikeCountProjection {

    UUID getArticleId();

    Long getTotal();
}
