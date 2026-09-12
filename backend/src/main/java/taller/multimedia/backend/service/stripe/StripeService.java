package taller.multimedia.backend.service.stripe;

import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StripeService {

    private final ServicePlanRepository servicePlanRepository;

    @Value ("${stripe.success.url}")
    private String successUrl;

    @Value("${stripe.cancel.url}")
    private String cancelUrl;

    public String createCheckoutSession(String priceId) throws StripeException {
        
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION) 
                .setSuccessUrl("https://tudominio.com/exito")
                .setCancelUrl("https://tudominio.com/cancelado")
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPrice(priceId)
                                .build()
                )
                .build();

        Session session = Session.create(params);

        return session.getUrl(); 
    }
}