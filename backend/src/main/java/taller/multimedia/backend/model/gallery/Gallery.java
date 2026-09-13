package taller.multimedia.backend.model.gallery;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import java.util.List;
import java.time.LocalDateTime;
import java.util.ArrayList;

@Entity
@Table(name = "gallery")
@Data // Lombok annotation to generate getters, setters, and other utility methods
@NoArgsConstructor
@AllArgsConstructor
public class Gallery {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "category_gallery_id", nullable = false)
    private CategoryGallery categoryGallery;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String description;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "gallery", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private List<GalleryImages> galleryImages = new ArrayList<>();
}
