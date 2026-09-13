package taller.multimedia.backend.model.expedient;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table (name = "expedient")
@Data 
@NoArgsConstructor
@AllArgsConstructor 
public class Expedient {
    @Id 
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name= "photo_url")
    private String photoUrl;

    @Column(name= "child_name", nullable = false, unique = true)
    private String childName;

    @Column(name= "admision_date", nullable = false)
    private LocalDate admisionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "educational_level", nullable = false)
    private EducationalLevel educationalLevel;

    @Column(name = "general_observations", length = 600)
    private String generalObservations;
}
