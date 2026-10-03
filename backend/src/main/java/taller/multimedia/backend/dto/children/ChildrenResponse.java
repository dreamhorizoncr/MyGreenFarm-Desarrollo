package taller.multimedia.backend.dto.children;

import java.time.LocalDate;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taller.multimedia.backend.model.children.Relationship;

@Data 
@NoArgsConstructor 
@AllArgsConstructor 
public class ChildrenResponse {
    private Long id;
    private Integer parentId;
    private String parentName;
    private Relationship relationship;
    private String firstName;
    private String lastName;
    private LocalDate birthDate;
    private String medicalNotes;
    private Set<String> clubNames;
}
