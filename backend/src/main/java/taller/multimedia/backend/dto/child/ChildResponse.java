package taller.multimedia.backend.dto.child;

import java.time.LocalDate;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taller.multimedia.backend.model.children.Relationship;

@Data 
@NoArgsConstructor 
@AllArgsConstructor 
public class ChildResponse {
    private Long id;
    private Integer parentId;
    private String parentName;
    private String studentId;
    private Relationship relationship;
    private String firstName;
    private String lastName;
    private LocalDate birthDate;
    private String medicalNotes;
    private Set<String> clubNames;
}
