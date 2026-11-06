package taller.multimedia.backend.service.dashboard;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.model.dashboard.DashboardSummaryCache;
import taller.multimedia.backend.repository.dashboard.DashboardSummaryCacheRepository;

@Service
@RequiredArgsConstructor
public class DashboardSummaryCacheService {

    private static final int MAX_GENERATIONS_PER_DAY = 2;

    private final DashboardSummaryCacheRepository repository;

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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveSummary(LocalDate date, String summary) {
        repository.findBySummaryDate(date).ifPresent(cache -> {
            cache.setSummary(summary);
            repository.save(cache);
        });
    }

    public record SummaryReservation(String summary, boolean shouldGenerate) {
    }
}
