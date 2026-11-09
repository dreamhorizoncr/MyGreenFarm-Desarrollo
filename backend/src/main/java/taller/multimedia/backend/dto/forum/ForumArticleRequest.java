package taller.multimedia.backend.dto.forum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ForumArticleRequest {

    @NotBlank(message = "The title is required")
    @Size(max = 120, message = "The title cannot exceed 120 characters")
    private String title;

    @NotBlank(message = "The topic is required")
    @Size(max = 60, message = "The topic cannot exceed 60 characters")
    private String topic;

    @NotBlank(message = "The content is required")
    @Size(max = 4000, message = "The content cannot exceed 4000 characters")
    private String content;

    @Size(max = 120, message = "The author name cannot exceed 120 characters")
    private String authorName;

    @Size(max = 40, message = "The author position cannot exceed 40 characters")
    private String authorRole;

    @Size(max = 140, message = "The alt text cannot exceed 140 characters")
    private String imageAlt;

    private boolean removeImage;
}
