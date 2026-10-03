package taller.multimedia.backend.dto.club;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClubImageResponse {

    private Long id;
    private Long clubId;
    private String fileUrl;
    private Boolean isCover;
    @JsonProperty("sortOrder")
    private Integer sortOrder;
}
