package taller.multimedia.backend.dto.forum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Comment that a visitor publishes on a community post. */
@Data
public class ForumCommunityCommentRequest {

    /** Name the visitor signs with, up to 40 characters. */
    @NotBlank
    @Size(max = 40)
    private String alias;

    /** Comment text, up to 4000 characters. */
    @NotBlank
    @Size(max = 4000)
    private String content;
}
