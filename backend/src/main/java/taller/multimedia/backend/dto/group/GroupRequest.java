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

    @NotBlank(message = "El nombre del grupo es obligatorio")
    @Size(max = 150, message = "El nombre no puede superar los 150 caracteres")
    private String name;

    @Size(max = 4000, message = "La descripción no puede superar los 4000 caracteres")
    private String description;

    @Min(value = 1, message = "La capacidad máxima debe ser al menos 1")
    private Integer maxCapacity;

    @NotEmpty(message = "Debe asignar al menos un teacher")
    private Set<UUID> teacherIds;

    private Set<Long> childIds;
}
