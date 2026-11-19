package taller.multimedia.backend.service.dashboard;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.model.dashboard.DashboardSummaryCache;
import taller.multimedia.backend.repository.dashboard.DashboardSummaryCacheRepository;

/**
 * Stores the AI-generated daily dashboard summary and limits how many times per day it can be
 * generated, so the AI provider is not called on every dashboard visit.
 */
@Service
@RequiredArgsConstructor
public class DashboardSummaryCacheService {

    private static final int MAX_GENERATIONS_PER_DAY = 2;

    private final DashboardSummaryCacheRepository repository;

    /**
     * Decides whether the summary for a day must be generated and, if so, counts the attempt.
     *
     * <p>Runs in its own transaction so the attempt is recorded even if the caller's transaction later
     * fails. Returns the cached summary when there is one, an empty summary when the daily limit
     * ({@code MAX_GENERATIONS_PER_DAY} attempts) is reached, or a reservation that tells the
     * caller to generate it.
     *
     * @param date day of the summary
     * @return the cached summary, or whether the caller should generate a new one
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public SummaryReservation reserveGeneration(LocalDate date) {
        DashboardSummaryCache cache = repository.findBySummaryDate(date)
                .orElseGet(() -> repository.save(new DashboardSummaryCache(date)));

        if (StringUtils.hasText(cache.getSummary())) {
            return new SummaryReservation(cache.getSummary(), false);
        }
        if (cache.getGenerationCount() >= MAX_GENERATIONS_PER_DAY) {
            return new SummaryReservation("", false);
        }

        cache.setGenerationCount(cache.getGenerationCount() + 1);
        repository.save(cache);
        return new SummaryReservation(null, true);
    }

    /**
     * Saves a generated summary for a day that was previously reserved with {@link
     * #reserveGeneration(LocalDate)}. Does nothing if the day has no cache row.
     *
     * @param date day of the summary
     * @param summary generated text
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveSummary(LocalDate date, String summary) {
        repository.findBySummaryDate(date).ifPresent(cache -> {
            cache.setSummary(summary);
            repository.save(cache);
        });
    }

    /**
     * Result of {@link #reserveGeneration(LocalDate)}.
     *
     * @param summary cached summary, an empty string when the daily limit was reached, or {@code
     *     null} when it must be generated
     * @param shouldGenerate {@code true} when the caller must generate the summary and save it with
     *     {@link #saveSummary(LocalDate, String)}
     */
    public record SummaryReservation(String summary, boolean shouldGenerate) {
    }
}
