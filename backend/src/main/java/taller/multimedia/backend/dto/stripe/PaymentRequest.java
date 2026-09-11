package taller.multimedia.backend.dto.stripe;

import lombok.Data;

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