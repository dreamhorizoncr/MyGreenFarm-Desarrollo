package taller.multimedia.backend.dto.club;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * An image of a club: its cover or one of its ordered gallery images.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClubImageResponse {

    private Long id;
    private Long clubId;
    private String fileUrl;
    private String altText;
    private Boolean isCover;
    @JsonProperty("sortOrder")
    private Integer sortOrder;
}
