package taller.multimedia.backend.service.exchange_rate;

import java.util.Optional;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import taller.multimedia.backend.dto.exchange_rate.ExchangeRateResponse;
import taller.multimedia.backend.dto.exchange_rate.ExchangeRates;
import taller.multimedia.backend.model.exchange_rate.ExchangeRate;
import taller.multimedia.backend.repository.exchange_rate.ExchangeRateRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateService {

    private final ExchangeRateRepository exchangeRateRepository;
    private final BacExchangeRateClient bacExchangeRateClient;

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        updateExchangeRate();
    }

    @Scheduled(cron = "${exchange-rate.cron:0 0 0,6,12,18 * * *}", zone = "America/Costa_Rica")
    public void updateExchangeRate() {
        try {
            String xml = bacExchangeRateClient.downloadXml();
            saveDailyRates(bacExchangeRateClient.extractCostaRicaRates(xml));
            log.info("[ExchangeRateService] Tipo de cambio actualizado");
        } catch (Exception e) {
            log.warn("[ExchangeRateService] No se pudo actualizar el tipo de cambio: {}", e.getMessage());
        }
    }

    @Transactional
    public ExchangeRate saveDailyRates(ExchangeRates rates) {
        ExchangeRate record = exchangeRateRepository.findByRateDate(rates.rateDate())
                .orElseGet(ExchangeRate::new);

        record.setRateDate(rates.rateDate());
        record.setUsdBuy(rates.usdBuy());
        record.setUsdSell(rates.usdSell());
        record.setEurBuy(rates.eurBuy());
        record.setEurSell(rates.eurSell());
        record.setSource(rates.source());

        return exchangeRateRepository.save(record);
    }

    @Transactional(readOnly = true)
    public Optional<ExchangeRateResponse> getCurrent() {
        return exchangeRateRepository.findTopByOrderByRateDateDesc().map(this::toResponse);
    }

    private ExchangeRateResponse toResponse(ExchangeRate record) {
        ExchangeRateResponse response = new ExchangeRateResponse();
        response.setId(record.getId());
        response.setRateDate(record.getRateDate());
        response.setUsdBuy(record.getUsdBuy());
        response.setUsdSell(record.getUsdSell());
        response.setEurBuy(record.getEurBuy());
        response.setEurSell(record.getEurSell());
        response.setSource(record.getSource());
        response.setCreatedAt(record.getCreatedAt());
        response.setUpdatedAt(record.getUpdatedAt());
        return response;
    }
}
