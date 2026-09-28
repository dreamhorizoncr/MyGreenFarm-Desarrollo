package taller.multimedia.backend.dto.forum;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ForumArticleLikeResponse {

    private UUID articleId;
    private Integer totalLikes;
    private boolean liked;
}
