package taller.multimedia.backend.dto.onvo;

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
}
