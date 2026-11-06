package taller.multimedia.backend.repository.dashboard;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import taller.multimedia.backend.model.dashboard.DashboardSummaryCache;

@Repository
public interface DashboardSummaryCacheRepository extends JpaRepository<DashboardSummaryCache, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<DashboardSummaryCache> findBySummaryDate(LocalDate summaryDate);
}
