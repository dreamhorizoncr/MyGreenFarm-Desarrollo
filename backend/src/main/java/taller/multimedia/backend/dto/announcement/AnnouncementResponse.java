package taller.multimedia.backend.dto.announcement;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;
import taller.multimedia.backend.model.announcement.AnnouncementType;

@Data
public class AnnouncementResponse {
        private UUID id;
        private String title; // Ya traducido (ya sea en inglés u otro lenguaje que pidió el usuario)
        private String content; // Ya traducido
        private AnnouncementType type;
        private LocalDateTime eventDate;
        private String location;

        public void setTitle(String title) {
            this.title = title;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public void setEventDate(LocalDateTime eventDate) {
            this.eventDate = eventDate;
        }

        public void setType(AnnouncementType type) {
            this.type = type;
        }

        public void setId(UUID id) {
            this.id = id;
        }
}
