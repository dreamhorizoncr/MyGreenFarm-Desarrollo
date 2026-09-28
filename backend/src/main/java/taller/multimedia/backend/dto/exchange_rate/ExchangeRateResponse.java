package taller.multimedia.backend.dto.exchange_rate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Data;

/**
 * Tasa de cambio tal como viaja al frontend.
 */
@Data
public class ExchangeRateResponse {

    private Long id;
    private LocalDate rateDate;
    private BigDecimal usdBuy;
    private BigDecimal usdSell;
    private BigDecimal eurBuy;
    private BigDecimal eurSell;
    private String source;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
