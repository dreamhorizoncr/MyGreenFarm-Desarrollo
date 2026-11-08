package taller.multimedia.backend.dto.group;

import java.util.Set;
import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupRequest {

    @NotBlank(message = "The group name is required")
    @Size(max = 150, message = "The name cannot exceed 150 characters")
    private String name;

    @Size(max = 4000, message = "The description cannot exceed 4000 characters")
    private String description;

    @Min(value = 1, message = "The maximum capacity must be at least 1")
    private Integer maxCapacity;

    @NotEmpty(message = "At least one teacher must be assigned")
    private Set<UUID> teacherIds;

    private Set<Long> childIds;
}
