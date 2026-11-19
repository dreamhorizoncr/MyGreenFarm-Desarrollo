package taller.multimedia.backend.dto.club;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * A club with its images and its current free spots (capacity minus enrolled children).
 */
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
    private Integer availableSpots;
    private boolean isPublished;
    private List<ClubImageResponse> images;
}
