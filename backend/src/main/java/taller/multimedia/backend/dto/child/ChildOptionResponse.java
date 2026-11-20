package taller.multimedia.backend.dto.child;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A child as an option of a select field.
 */
@Data 
@AllArgsConstructor 
@NoArgsConstructor 
public class ChildOptionResponse {
    private Long id;
    private String studentId;
    private String fullName;
}
