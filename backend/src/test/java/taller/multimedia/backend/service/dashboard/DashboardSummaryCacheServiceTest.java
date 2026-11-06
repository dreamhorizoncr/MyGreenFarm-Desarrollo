package taller.multimedia.backend.service.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.model.dashboard.DashboardSummaryCache;
import taller.multimedia.backend.repository.dashboard.DashboardSummaryCacheRepository;

@ExtendWith(MockitoExtension.class)
class DashboardSummaryCacheServiceTest {

    @Mock
    private DashboardSummaryCacheRepository repository;

    @InjectMocks
    private DashboardSummaryCacheService cacheService;

    @Test
    void returnsCachedSummaryWithoutReservingAnotherGeneration() {
        LocalDate date = LocalDate.of(2026, 11, 5);
        DashboardSummaryCache cache = cache(date, "Resumen guardado.", 1);
        when(repository.findBySummaryDate(date)).thenReturn(Optional.of(cache));

        var reservation = cacheService.reserveGeneration(date);

        assertThat(reservation.summary()).isEqualTo("Resumen guardado.");
        assertThat(reservation.shouldGenerate()).isFalse();
    }

    @Test
    void stopsAfterTwoGenerationsWhenNoSummaryWasSaved() {
        LocalDate date = LocalDate.of(2026, 11, 5);
        DashboardSummaryCache cache = cache(date, null, 2);
        when(repository.findBySummaryDate(date)).thenReturn(Optional.of(cache));

        var reservation = cacheService.reserveGeneration(date);

        assertThat(reservation.summary()).isEmpty();
        assertThat(reservation.shouldGenerate()).isFalse();
    }

    @Test
    void reservesGenerationAndPersistsCounter() {
        LocalDate date = LocalDate.of(2026, 11, 5);
        DashboardSummaryCache cache = cache(date, null, 1);
        when(repository.findBySummaryDate(date)).thenReturn(Optional.of(cache));

        var reservation = cacheService.reserveGeneration(date);

        assertThat(reservation.summary()).isNull();
        assertThat(reservation.shouldGenerate()).isTrue();
        assertThat(cache.getGenerationCount()).isEqualTo(2);
        verify(repository).save(cache);
    }

    private DashboardSummaryCache cache(LocalDate date, String summary, int count) {
        DashboardSummaryCache cache = new DashboardSummaryCache(date);
        cache.setSummary(summary);
        cache.setGenerationCount(count);
        return cache;
    }
}
