package taller.multimedia.backend.dto.gallery;

import java.util.UUID;

import lombok.Data;

@Data
public class CategoryGalleryResponse {
    private UUID id;
    private String title;
}
