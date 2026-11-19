package taller.multimedia.backend.dto.exchangerate;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Rates read from the bank before they are saved.
 *
 * @param rateDate day of the rates
 * @param usdBuy colones the bank pays per US dollar
 * @param usdSell colones the bank charges per US dollar
 * @param eurBuy colones the bank pays per euro
 * @param eurSell colones the bank charges per euro
 * @param source bank that published the rates
 */
public record ExchangeRates(
        LocalDate rateDate,
        BigDecimal usdBuy,
        BigDecimal usdSell,
        BigDecimal eurBuy,
        BigDecimal eurSell,
        String source) {
}
