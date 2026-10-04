package taller.multimedia.backend.dto.child;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@AllArgsConstructor 
@NoArgsConstructor 
public class ChildOptionResponse {
    private Long id;
    private String studentId;
    private String fullName;
}
