package taller.multimedia.backend.repository.dashboard;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import taller.multimedia.backend.model.dashboard.DashboardSummaryCache;

import jakarta.persistence.LockModeType;

/**
 * Storage of the daily dashboard AI summaries.
 */
public interface DashboardSummaryCacheRepository extends JpaRepository<DashboardSummaryCache, Long> {

    /**
     * Locks the row until the transaction ends, so two requests cannot both decide to generate the
     * same day's summary.
     *
     * @param summaryDate day of the summary
     * @return the day's cache row, if any
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<DashboardSummaryCache> findBySummaryDate(LocalDate summaryDate);
}
