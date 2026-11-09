package taller.multimedia.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ImageAltRequest {

    @Size(max = 140, message = "The alt text must be at most 140 characters.")
    private String altText;
}
