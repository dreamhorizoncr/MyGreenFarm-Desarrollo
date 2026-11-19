package taller.multimedia.backend.dto.common;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * New alternative text of an image, for screen readers.
 */
@Data
public class ImageAltRequest {

    @Size(max = 140, message = "The alt text must be at most 140 characters.")
    private String altText;
}
