package taller.multimedia.backend.dto.gallery;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Data;

@Data
public class CategoryGalleryRequest {

    @NotBlank(message = "The title is required")
    @Size(min = 3, max = 70, message = "The title must be between 3 and 70 characters")
    private String title;
}