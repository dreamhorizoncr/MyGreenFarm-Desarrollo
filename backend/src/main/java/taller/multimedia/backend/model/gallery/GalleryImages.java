package taller.multimedia.backend.model.gallery;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;


@Entity 
@Table(name = "gallery_images")
@Data // Lombok annotation to generate getters, setters, and other utility methods
@NoArgsConstructor
@AllArgsConstructor
public class GalleryImages {
    @Id 
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "gallery_id", nullable = false)
    private Gallery gallery;

    @Column (nullable = false)
    private String title;

    @Column (nullable = false)
    private String fileUrl;

}
