package taller.multimedia.backend.controller.exchange_rate;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.exchange_rate.ExchangeRateResponse;
import taller.multimedia.backend.service.exchange_rate.ExchangeRateService;

@RestController
@RequestMapping("/api/tipo-cambio")
@RequiredArgsConstructor
public class ExchangeRateController {

    private final ExchangeRateService exchangeRateService;

    @GetMapping("/actual")
    public ResponseEntity<ExchangeRateResponse> getCurrent() {
        return exchangeRateService.getCurrent()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NO_CONTENT).build());
    }

    @PostMapping("/actualizar-ahora")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ExchangeRateResponse> updateNow() {
        exchangeRateService.updateExchangeRate();
        return exchangeRateService.getCurrent()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NO_CONTENT).build());
    }
}
