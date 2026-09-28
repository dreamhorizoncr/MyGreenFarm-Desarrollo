package taller.multimedia.backend.repository.exchange_rate;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.exchange_rate.ExchangeRate;

@Repository
public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {

    // Para el upsert: revisar si ya existe un registro de hoy antes de crear uno nuevo
    Optional<ExchangeRate> findByRateDate(LocalDate rateDate);

    // El más reciente, para el endpoint que consume el frontend
    Optional<ExchangeRate> findTopByOrderByRateDateDesc();
}
