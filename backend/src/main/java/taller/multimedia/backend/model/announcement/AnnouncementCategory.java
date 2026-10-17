package taller.multimedia.backend.model.announcement;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "announcement_categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 40)
    private String title;

    @Column(unique = true, length = 30)
    private String code;

    @Column(nullable = false)
    private int position;
}
