package taller.multimedia.backend.dto.exchange_rate;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExchangeRates(
        LocalDate rateDate,
        BigDecimal usdBuy,
        BigDecimal usdSell,
        BigDecimal eurBuy,
        BigDecimal eurSell,
        String source) {
}
