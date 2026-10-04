package taller.multimedia.backend.model.club;

import lombok.Data;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "club_images")
@Data 
@NoArgsConstructor
@AllArgsConstructor
public class ClubImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    private Boolean isCover = false;

    public ClubImage(Club club, String fileUrl, Boolean isCover, Integer sortOrder) {
        this.club = club;
        this.fileUrl = fileUrl;
        this.isCover = isCover != null ? isCover : false;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
    }
}
