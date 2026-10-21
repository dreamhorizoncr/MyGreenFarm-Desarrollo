package taller.multimedia.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ImageAltRequest {

    @Size(max = 140, message = "El texto alternativo debe tener como máximo 140 caracteres.")
    private String altText;
}
