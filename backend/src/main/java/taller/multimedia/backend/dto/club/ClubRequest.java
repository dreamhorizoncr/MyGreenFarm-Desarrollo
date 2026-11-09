package taller.multimedia.backend.dto.club;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClubRequest {

    @NotBlank(message = "The club name is required")
    @Size(max = 150, message = "The name cannot exceed 150 characters")
    private String name;

    @NotBlank(message = "The description is required")
    @Size(max = 4000, message = "The description cannot exceed 150 characters")
    private String description;

    @NotBlank(message = "The schedule is required")
    @Size(max = 255, message = "The schedule cannot exceed 255 characters")
    private String schedule;

    @Min(value = 1, message = "The maximum capacity must be at least 1")
    private Integer maxCapacity;

    @NotNull (message = "The publication status cannot be null")
    private Boolean isPublished;

    private List<ClubImageRequest> images;
}