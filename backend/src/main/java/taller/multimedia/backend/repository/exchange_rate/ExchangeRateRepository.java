package taller.multimedia.backend.repository.exchange_rate;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.exchange_rate.ExchangeRate;

@Repository
public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {

    Optional<ExchangeRate> findByRateDate(LocalDate rateDate);

    Optional<ExchangeRate> findTopByOrderByRateDateDesc();
}
