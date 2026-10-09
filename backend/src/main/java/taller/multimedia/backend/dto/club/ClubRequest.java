package taller.multimedia.backend.dto.club;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClubRequest {

    @NotBlank(message = "El nombre del club es obligatorio")
    @Size(max = 150, message = "El nombre no puede exceder los 150 caracteres")
    private String name;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(max = 4000, message = "La descripción no puede exceder los 150 caracteres")
    private String description;

    @NotBlank(message = "El horario es obligatorio")
    @Size(max = 255, message = "El horario no puede exceder los 255 caracteres")
    private String schedule;

    @Min(value = 1, message = "La capacidad máxima debe ser al menos 1")
    private Integer maxCapacity;

    @NotNull (message = "El estado de publicación no puede ser nulo")
    private Boolean isPublished;

    private List<ClubImageRequest> images;
}