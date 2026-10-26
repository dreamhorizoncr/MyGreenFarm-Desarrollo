package taller.multimedia.backend.dto.onvo;

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
    private double totalAmount;
    private String description;
    private String language;
    private String cabysCode;
    private double taxRate;
    private String currency;
}
