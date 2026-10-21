package taller.multimedia.backend.dto.onvo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder 
@NoArgsConstructor
@AllArgsConstructor
public class PricePaymentRequest {
    private String priceId;
    private String customerEmail;
    private String description;
}
