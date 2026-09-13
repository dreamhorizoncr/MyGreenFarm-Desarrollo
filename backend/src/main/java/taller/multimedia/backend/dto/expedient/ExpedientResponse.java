package taller.multimedia.backend.dto.expedient;

import lombok.Builder;
import lombok.Data;
import taller.multimedia.backend.model.expedient.EducationalLevel;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class ExpedientResponse {
    private UUID id;
    private String childName;
    private LocalDate admisionDate;
    private EducationalLevel educationalLevel;
    private String generalObservations;
    private String photoUrl;
}
