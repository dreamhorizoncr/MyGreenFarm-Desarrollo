package taller.multimedia.backend.dto.group;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import taller.multimedia.backend.dto.child.ChildOptionResponse;

/**
 * A class group with its teachers, children and free spots.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupResponse {

    private Long id;
    private String name;
    private String description;
    private Integer maxCapacity;
    private Integer enrolledChildren;
    private Integer availableSpots;
    private List<UUID> teacherIds;
    private List<String> teacherNames;
    private List<ChildOptionResponse> children;
}
