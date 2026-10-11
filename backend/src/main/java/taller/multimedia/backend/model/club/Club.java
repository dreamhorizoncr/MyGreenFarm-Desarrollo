package taller.multimedia.backend.model.club;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.BatchSize;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taller.multimedia.backend.model.child.ChildClub;

@Entity
@Table(name = "clubs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Club {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT", length = 4000)
    private String description;

    @Column(length = 255)
    private String schedule;

    @Column(name = "max_capacity")
    private Integer maxCapacity;

    @Column(name = "available_spots")
    private Integer availableSpots;

    @Column(name = "is_published", nullable = false)
    private boolean isPublished = false;

    @OneToMany(mappedBy = "club", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChildClub> childClubs = new ArrayList<>();

    @OneToMany(mappedBy = "club", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 20)
    private List<ClubImage> images = new ArrayList<>();

    public Club(String name, String description, String schedule, Integer maxCapacity, boolean isPublished) {
        this.name = name;
        this.description = description;
        this.schedule = schedule;
        this.maxCapacity = maxCapacity;
        this.availableSpots = maxCapacity;
        this.isPublished = isPublished;
    }

    public boolean decrementSpot() {
        if (this.availableSpots != null && this.availableSpots > 0) {
            this.availableSpots--;
            return true;
        }
        return false;
    }

    public void incrementSpot() {
        if (this.availableSpots != null && (this.maxCapacity == null || this.availableSpots < this.maxCapacity)) {
            this.availableSpots++;
        }
    }
}