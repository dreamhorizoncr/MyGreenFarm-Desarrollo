package taller.multimedia.backend.dto.onvo;

import java.math.BigDecimal;
import java.util.UUID;

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
