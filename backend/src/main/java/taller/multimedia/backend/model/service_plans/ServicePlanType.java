package taller.multimedia.backend.model.service_plans;

import com.stripe.param.checkout.SessionCreateParams;
import static com.stripe.param.checkout.SessionCreateParams.LineItem.PriceData.Recurring.Interval;

public enum ServicePlanType {
    ONE_TIME,
    MONTHLY,
    ANNUAL;

    public SessionCreateParams.Mode getStripeMode() {
        return this == ONE_TIME ? SessionCreateParams.Mode.PAYMENT : SessionCreateParams.Mode.SUBSCRIPTION;
    }

    public Interval getInterval() {
        return switch (this) {
            case MONTHLY -> Interval.MONTH;
            case ANNUAL -> Interval.YEAR;
            default -> null;
        };
    }
}