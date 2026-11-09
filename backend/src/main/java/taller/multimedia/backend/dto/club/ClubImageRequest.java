package taller.multimedia.backend.dto.club;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClubImageRequest {

    @NotBlank(message = "The image URL is required")
    private String fileUrl;

    @Min(value = 0, message = "The order cannot be negative")
    @JsonProperty("sortOrder")
    private Integer sortOrder;
}