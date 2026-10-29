package taller.multimedia.backend.dto.onvo;

import java.util.UUID;

import lombok.Data;

@Data 
public class ConfirmSinpeRequest {
    private String paymentIntentId;
    private String phoneNumber;
    private String sinpeReference;
    private String clientName;
    private String clientEmail;
    private String identificationType;
    private String clientIdentification;
    private String description;
    private String language;
    private String currency;
    private UUID servicePlanId;
    private String couponCode;
}
