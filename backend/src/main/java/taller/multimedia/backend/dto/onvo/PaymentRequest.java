package taller.multimedia.backend.dto.onvo;

import lombok.Data;

/**
 * Payment request by plan. Part of online payments, which are currently disabled.
 */
@Data 
public class PaymentRequest {

    private String stripePlanId;

    public String getServicePlanId() {
        return stripePlanId;
    }

    public void setServicePlanId(String stripePlanId) {
        this.stripePlanId = stripePlanId;
    }
}