package taller.multimedia.backend.repository.onvo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.onvo.PaymentIntentPricing;

@Repository
public interface PaymentIntentPricingRepository extends JpaRepository<PaymentIntentPricing, Long> {
    Optional<PaymentIntentPricing> findByPaymentIntentId(String paymentIntentId);
}
