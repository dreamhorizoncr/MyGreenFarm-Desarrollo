package taller.multimedia.backend.dto.exchangerate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Data;

/**
 * Exchange rate of one day: colones per US dollar and per euro, buying and selling.
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
