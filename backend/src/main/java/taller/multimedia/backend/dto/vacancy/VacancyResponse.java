package taller.multimedia.backend.dto.vacancy;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class VacancyResponse {
    private UUID id;
    private String title;
    private String description;

    @JsonProperty("isOpen")
    private boolean isOpen;

    private LocalDateTime createdAt;
    private UUID filledByApplicationId;
    private List<String> requiredFields;
}
