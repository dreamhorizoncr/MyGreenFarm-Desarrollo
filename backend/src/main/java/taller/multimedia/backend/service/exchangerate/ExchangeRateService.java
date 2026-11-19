package taller.multimedia.backend.service.exchangerate;

import java.util.Optional;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import taller.multimedia.backend.dto.exchangerate.ExchangeRateResponse;
import taller.multimedia.backend.dto.exchangerate.ExchangeRates;
import taller.multimedia.backend.model.exchangerate.ExchangeRate;
import taller.multimedia.backend.repository.exchangerate.ExchangeRateRepository;

/**
 * Keeps the daily colón exchange rate (US dollar and euro) published by BAC Credomatic, used to
 * show prices in other currencies.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateService {

    private final ExchangeRateRepository exchangeRateRepository;
    private final BacExchangeRateClient bacExchangeRateClient;

    /**
     * Updates the exchange rate as soon as the application is ready, so a fresh deployment does not
     * wait for the next scheduled run.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        updateExchangeRate();
    }

    /**
     * Downloads BAC's rates and saves today's values. Runs at 00:00, 06:00, 12:00 and 18:00 Costa
     * Rica time by default ({@code exchange-rate.cron}).
     *
     * <p>Failures are only logged: the last saved rate keeps being used until the next run.
     */
    @Scheduled(cron = "${exchange-rate.cron:0 0 0,6,12,18 * * *}", zone = "America/Costa_Rica")
    public void updateExchangeRate() {
        try {
            String xml = bacExchangeRateClient.downloadXml();
            saveDailyRates(bacExchangeRateClient.extractCostaRicaRates(xml));
            log.info("[ExchangeRateService] Exchange rate updated");
        } catch (Exception e) {
            log.warn("[ExchangeRateService] Could not update the exchange rate: {}", e.getMessage());
        }
    }

    /**
     * Saves the rates for their date, replacing the values already stored for that day.
     *
     * @param rates buy and sell rates for one day
     * @return the saved row
     */
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

    /**
     * @return the most recent saved exchange rate, or empty if none has been downloaded yet
     */
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
