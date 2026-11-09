package taller.multimedia.backend.dto.announcement;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AnnouncementRequest {
    @NotBlank(message = "The title is required") 
    @Size(min = 3, max = 70, message = "The title must be between 3 and 70 characters")
    private String title;

    @NotBlank(message = "The content is required")
    @Size(min = 10, max = 4000, message = "The content cannot exceed 4000 characters")
    private String content;

    @NotNull(message = "The category is required")
    private UUID categoryId;

    private LocalDateTime eventDate;
    @Size(min = 5, max = 255, message = "The location cannot exceed 255 characters")
    private String location;

    public String getLocation() {
        return location;
    }

    public LocalDateTime getEventDate() {
        return eventDate;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public String getContent() {
        return content;
    }

    public String getTitle() {
        return title;
    }
}
