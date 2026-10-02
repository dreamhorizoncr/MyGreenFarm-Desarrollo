package taller.multimedia.backend.dto.forum;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data public class ForumCommunityCommentRequest {
    @NotBlank @Size(max=40) private String alias;
    @NotBlank @Size(max=4000) private String content;
}
