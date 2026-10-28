package taller.multimedia.backend.dto.onvo;

import java.util.UUID;

import com.google.auto.value.AutoValue.Builder;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder 
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmPaymentRequest {
    private String paymentIntentId;
    private String paymentMethodId;
    private String cardNumber;
    private Integer expMonth;
    private Integer expYear;
    private String cvc;
    private String cardHolder;
    private String clientName;
    private String clientEmail;
    private String identificationType;
    private String clientIdentification;
    private String description;
    private String language;
    private UUID servicePlanId;
    private String couponCode;
    private boolean saveSubscription;
}
