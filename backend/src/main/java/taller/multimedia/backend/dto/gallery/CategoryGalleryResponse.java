package taller.multimedia.backend.dto.gallery;

import java.util.UUID;

import lombok.Data;

/**
 * A gallery category.
 */
@Data
public class CategoryGalleryResponse {
    private UUID id;
    private String title;
}
