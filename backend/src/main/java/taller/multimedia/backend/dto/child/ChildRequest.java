package taller.multimedia.backend.dto.child;

import java.time.LocalDate;
import java.util.Set;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import taller.multimedia.backend.model.child.Relationship;

@NoArgsConstructor 
@AllArgsConstructor 
@Builder 
@Data 
public class ChildRequest {

    @NotNull (message = "The parent/guardian ID number is required")
    private String parentIdentification;

    @NotNull(message = "The relationship is required")
    private Relationship relationship;

    @NotBlank(message = "The name is required")
    @Size(max = 100, message = "The name cannot exceed 100 characters")
    private String firstName;

    @NotBlank(message = "The last name is required")
    @Size(max = 100, message = "The last name cannot exceed 100 characters")
    private String lastName;

    @Past(message = "The birth date must be in the past")
    private LocalDate birthDate;

    private String medicalNotes;

    private Boolean isActive = true;

    private Set<Long> clubIds;
}