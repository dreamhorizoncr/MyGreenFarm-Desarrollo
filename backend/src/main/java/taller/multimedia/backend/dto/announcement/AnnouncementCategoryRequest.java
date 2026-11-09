package taller.multimedia.backend.dto.announcement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AnnouncementCategoryRequest {
    @NotBlank(message = "The category name is required")
    @Size(min = 2, max = 40, message = "The category name must be between 2 and 40 characters")
    private String title;
}
