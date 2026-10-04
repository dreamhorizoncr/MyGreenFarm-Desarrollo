package taller.multimedia.backend.dto.club;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClubResponse {

    private Long id;
    private String name;
    private String description;
    private String schedule;
    private Integer maxCapacity;
    private List<ClubImageResponse> images;
}
