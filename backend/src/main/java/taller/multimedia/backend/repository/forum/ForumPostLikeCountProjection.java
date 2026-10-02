package taller.multimedia.backend.repository.forum;

import java.util.UUID;

public interface ForumPostLikeCountProjection {
    UUID getPostId();

    Long getTotal();
}
