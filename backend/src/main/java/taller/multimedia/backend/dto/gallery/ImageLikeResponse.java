package taller.multimedia.backend.dto.gallery;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data 
@AllArgsConstructor
public class ImageLikeResponse {
    private UUID galleryImagesId;
    private Integer totalLikes;
}
