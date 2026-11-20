package taller.multimedia.backend.dto.onvo;

import lombok.Data;

/**
 * Onvo checkout session. Part of online payments, which are currently disabled.
 */
@Data 
public class OnvoCheckoutResponse {
    private String id;
    private String url;
}