package taller.multimedia.backend.dto.announcement;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;

@Data
public class AnnouncementResponse {
        private UUID id;
        private String title;
        private String content;
        private UUID categoryId;
        private String categoryTitle;
        private String categoryCode;
        private LocalDateTime eventDate;
        private String location;
        private String aiSummary;

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


        public void setId(UUID id) {
            this.id = id;
        }
}
