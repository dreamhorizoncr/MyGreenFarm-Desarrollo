package taller.multimedia.backend.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import taller.multimedia.backend.model.AnnouncementType;

@Data
public class AnnouncementRequest {
        @NotBlank(message = "El título es obligatorio")
        private String title;

        @NotBlank(message = "El contenido es obligatorio")
        private String content;

        @NotNull(message = "El tipo de anuncio es obligatorio")
        private AnnouncementType type;

        private LocalDateTime eventDate;
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
