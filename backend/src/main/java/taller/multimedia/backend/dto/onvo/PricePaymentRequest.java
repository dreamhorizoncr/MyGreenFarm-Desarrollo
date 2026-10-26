package taller.multimedia.backend.dto.onvo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder 
@NoArgsConstructor
@AllArgsConstructor
public class PricePaymentRequest {
    private String priceId;
    private String customerEmail;
    private String description;
    private UUID servicePlanId;
    private BigDecimal baseAmount;
    private String paymentMethod;
    private String language;
}
