package taller.multimedia.backend.dto.exchange_rate;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Tasas recién leídas de la fuente externa, antes de persistirlas.
 * Los montos vienen expresados en colones por 1 unidad de la moneda extranjera.
 */
public record ExchangeRates(
        LocalDate rateDate,
        BigDecimal usdBuy,
        BigDecimal usdSell,
        BigDecimal eurBuy,
        BigDecimal eurSell,
        String source) {
}
