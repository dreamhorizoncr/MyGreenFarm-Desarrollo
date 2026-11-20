package taller.multimedia.backend.repository.exchangerate;

import java.time.LocalDate;
import java.util.Optional;

import taller.multimedia.backend.model.exchangerate.ExchangeRate;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Storage of the daily exchange rates, one row per day.
 */
public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {

    Optional<ExchangeRate> findByRateDate(LocalDate rateDate);

    Optional<ExchangeRate> findTopByOrderByRateDateDesc();
}
