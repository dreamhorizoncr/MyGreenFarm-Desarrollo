package taller.multimedia.backend.repository.exchange_rate;

import java.time.LocalDate;
import java.util.Optional;

import taller.multimedia.backend.model.exchange_rate.ExchangeRate;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {

    Optional<ExchangeRate> findByRateDate(LocalDate rateDate);

    Optional<ExchangeRate> findTopByOrderByRateDateDesc();
}
