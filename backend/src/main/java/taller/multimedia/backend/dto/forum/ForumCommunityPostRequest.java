package taller.multimedia.backend.dto.forum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ForumCommunityPostRequest {

    @NotBlank(message = "The name is required")
    @Size(max = 40, message = "The name cannot exceed 40 characters")
    private String name;

    @NotBlank(message = "The content is required")
    @Size(max = 4000, message = "The content cannot exceed 4000 characters")
    private String content;
}
