package taller.multimedia.backend.repository.onvo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import taller.multimedia.backend.model.onvo.PaymentIntentPricing;

public interface PaymentIntentPricingRepository extends JpaRepository<PaymentIntentPricing, Long> {
    Optional<PaymentIntentPricing> findByPaymentIntentId(String paymentIntentId);
}
