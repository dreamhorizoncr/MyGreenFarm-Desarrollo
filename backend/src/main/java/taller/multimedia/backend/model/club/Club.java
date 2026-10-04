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

@Entity 
@Table (name = "clubs")
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

    @OneToMany(mappedBy = "club", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 20)
    private List<ClubImage> images = new ArrayList<>();

    public Club(String name, String description, String schedule, Integer maxCapacity) {
        this.name = name;
        this.description = description;
        this.schedule = schedule;
        this.maxCapacity = maxCapacity;
    }
}