package taller.multimedia.backend.dto.gallery;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.Data;

import java.util.UUID;

@Data
public class GalleryRequest {

    @NotNull 
    private UUID categoryId;

    @NotBlank(message = "The title is required")
    @Size(min = 5, max = 70, message = "The title must be between 50 and 70 characters")
    private String title;

    @NotBlank(message = "The description is required")
    @Size(min = 20, max = 200, message = "The content cannot exceed 200 characters")
    private String description;

    @NotNull(message = "The featured status is required")
    private Boolean featured = false;

}
