package taller.multimedia.backend.dto.electronicbilling;

import lombok.Data;

/**
 * Data of an electronic invoice. Part of electronic billing, which is currently disabled.
 */
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
