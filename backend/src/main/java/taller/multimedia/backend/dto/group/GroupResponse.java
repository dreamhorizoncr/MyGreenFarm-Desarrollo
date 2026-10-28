package taller.multimedia.backend.dto.group;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import taller.multimedia.backend.dto.child.ChildOptionResponse;

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
    private UUID teacherId;
    private String teacherName;
    private List<ChildOptionResponse> children;
}
