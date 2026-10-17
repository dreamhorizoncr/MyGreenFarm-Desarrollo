package taller.multimedia.backend.dto.announcement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AnnouncementCategoryRequest {
    @NotBlank(message = "El nombre de la categoría es obligatorio")
    @Size(min = 2, max = 40, message = "El nombre de la categoría debe tener entre 2 y 40 caracteres")
    private String title;
}
