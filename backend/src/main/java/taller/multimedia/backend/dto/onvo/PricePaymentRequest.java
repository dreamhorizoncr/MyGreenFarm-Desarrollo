package taller.multimedia.backend.dto.onvo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private String paymentMethod;
    private String language;
    private String couponCode;
    private Boolean saveSubscription = false;
}
