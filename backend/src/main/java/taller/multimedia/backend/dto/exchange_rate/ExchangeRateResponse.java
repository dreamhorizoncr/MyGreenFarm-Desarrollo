package taller.multimedia.backend.dto.exchange_rate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Data;

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
