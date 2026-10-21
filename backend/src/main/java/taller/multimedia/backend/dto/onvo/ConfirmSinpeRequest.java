package taller.multimedia.backend.dto.onvo;

import lombok.Data;

@Data 
public class ConfirmSinpeRequest {
    private String paymentIntentId;
    private String phoneNumber;
    private String sinpeReference;
}
