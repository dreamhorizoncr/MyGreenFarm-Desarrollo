package taller.multimedia.backend.model.dashboard;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "dashboard_summary_cache", uniqueConstraints = @UniqueConstraint(columnNames = "summary_date"))
@Getter
@Setter
@NoArgsConstructor
public class DashboardSummaryCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "summary_date", nullable = false, unique = true)
    private LocalDate summaryDate;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "generation_count", nullable = false)
    private int generationCount;

    public DashboardSummaryCache(LocalDate summaryDate) {
        this.summaryDate = summaryDate;
    }
}
