package taller.multimedia.backend.dto.vacancy;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class VacancyResponse {
    private UUID id;
    private String title;
    private String description;

    // Getter manual con @JsonProperty más abajo: si Lombok generara isOpen()
    // aquí (el nombre por defecto para un campo "open"), Jackson lo detecta
    // bien como "open"; el problema es forzarlo a "isOpen" sin que también
    // aparezca "open" duplicado en el JSON.
    @Getter(AccessLevel.NONE)
    private boolean open;

    private LocalDateTime createdAt;
    private UUID filledByApplicationId;
    private List<String> requiredFields;

    @JsonProperty("isOpen")
    public boolean isOpen() {
        return open;
    }
}
