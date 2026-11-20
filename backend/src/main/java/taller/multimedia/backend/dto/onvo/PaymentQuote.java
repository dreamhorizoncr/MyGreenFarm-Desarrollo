package taller.multimedia.backend.dto.onvo;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Breakdown of the price of a service plan payment. Part of online payments with Onvo, which are
 * currently disabled.
 */
public record PaymentQuote(
        UUID servicePlanId,
        BigDecimal baseAmount,
        BigDecimal discountAmount,
        BigDecimal serviceTaxAmount,
        BigDecimal processingFeeAmount,
        BigDecimal processingFeeTaxAmount,
        BigDecimal totalAmount,
        String currency,
        String paymentMethod,
        BigDecimal exchangeRate,
        String cabysCode,
        BigDecimal taxRate,
        String cabysDescription) {
}
