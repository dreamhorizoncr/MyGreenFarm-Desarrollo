package taller.multimedia.backend.dto.announcement;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import taller.multimedia.backend.model.announcement.AnnouncementType;

@Data
public class AnnouncementRequest {
    @NotBlank(message = "El título es obligatorio") 
    @Size(min = 3, max = 70, message = "El título debe tener entre 3 y 70 caracteres")
    private String title;

    @NotBlank(message = "El contenido es obligatorio")
    @Size(min = 10, max = 4000, message = "El contenido no puede superar los 4000 caracteres")
    private String content;

    @NotNull(message = "El tipo de anuncio es obligatorio")
    private AnnouncementType type;

    private LocalDateTime eventDate;
    @Size(min = 5, max = 255, message = "La locación no puede superar los 255 caracteres")
    private String location;

    public String getLocation() {
        return location;
    }

    public LocalDateTime getEventDate() {
        return eventDate;
    }

    public AnnouncementType getType() {
        return type;
    }

    public String getContent() {
        return content;
    }

    public String getTitle() {
        return title;
    }
}
