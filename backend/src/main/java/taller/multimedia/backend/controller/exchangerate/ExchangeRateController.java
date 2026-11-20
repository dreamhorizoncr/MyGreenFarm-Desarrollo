package taller.multimedia.backend.controller.exchangerate;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.exchangerate.ExchangeRateResponse;
import taller.multimedia.backend.service.exchangerate.ExchangeRateService;

/**
 * Daily US dollar and euro exchange rates in colones.
 */
@RestController
@RequestMapping("/api/exchange-rate")
@RequiredArgsConstructor
public class ExchangeRateController {

    private final ExchangeRateService exchangeRateService;

    /**
     * {@code GET /api/exchange-rate/current}, public.
     *
     * @return the latest rate, or 204 if none was downloaded yet
     */
    @GetMapping("/current")
    public ResponseEntity<ExchangeRateResponse> getCurrent() {
        return exchangeRateService.getCurrent()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NO_CONTENT).build());
    }

    /**
     * {@code POST /api/exchange-rate/refresh}, owner only: downloads the rates now instead of
     * waiting for the scheduled update.
     *
     * @return the latest rate, or 204 if the download failed and there is no previous rate
     */
    @PostMapping("/refresh")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ExchangeRateResponse> updateNow() {
        exchangeRateService.updateExchangeRate();
        return exchangeRateService.getCurrent()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NO_CONTENT).build());
    }
}
