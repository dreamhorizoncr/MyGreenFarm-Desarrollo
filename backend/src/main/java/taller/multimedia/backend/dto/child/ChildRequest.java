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

    @NotNull (message = "El ID del padre/tutor es obligatorio")
    private Long parentId;

    @NotNull(message = "El parentesco es obligatorio")
    private Relationship relationship;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder los 100 caracteres")
    private String firstName;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(max = 100, message = "El apellido no puede exceder los 100 caracteres")
    private String lastName;

    @Past(message = "La fecha de nacimiento debe ser en el pasado")
    private LocalDate birthDate;

    private String medicalNotes;

    private Set<Long> clubIds;
}