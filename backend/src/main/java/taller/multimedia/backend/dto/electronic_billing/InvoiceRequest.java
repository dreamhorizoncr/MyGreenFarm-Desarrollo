package taller.multimedia.backend.dto.electronic_billing;

import lombok.Data;

@Data 
public class InvoiceRequest {
    private String clientName;
    private String clientEmail;
    private String identificationType;
    private String clientIdentification;
    private double totalAmount;
    private String serviceDescription;
    private String cabysCode;
    private String idempotencyKey;
    private double taxRate;
}
