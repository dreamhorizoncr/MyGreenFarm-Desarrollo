package taller.multimedia.backend.dto.forum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Comment that a visitor publishes on a forum article.
 */
@Data
public class ForumCommentRequest {

    @NotBlank(message = "The alias is required")
    @Size(max = 40, message = "The alias cannot exceed 40 characters")
    private String alias;

    @NotBlank(message = "The content is required")
    @Size(max = 4000, message = "The content cannot exceed 4000 characters")
    private String content;
}
