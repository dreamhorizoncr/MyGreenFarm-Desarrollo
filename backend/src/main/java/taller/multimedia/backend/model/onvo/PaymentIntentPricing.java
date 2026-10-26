package taller.multimedia.backend.model.onvo;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "payment_intent_pricing")
@Getter
@Setter
@NoArgsConstructor
public class PaymentIntentPricing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_intent_id", nullable = false, unique = true, length = 100)
    private String paymentIntentId;

    @Column(name = "service_description", nullable = false, length = 500)
    private String serviceDescription;

    @Column(name = "base_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal baseAmount;

    @Column(name = "service_tax_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal serviceTaxAmount;

    @Column(name = "processing_fee_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal processingFeeAmount;

    @Column(name = "processing_fee_tax_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal processingFeeTaxAmount;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "payment_method", nullable = false, length = 20)
    private String paymentMethod;

    @Column(name = "service_cabys_code", nullable = false, length = 20)
    private String serviceCabysCode;

    @Column(name = "service_tax_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal serviceTaxRate;

    @Column(name = "fee_cabys_code", nullable = false, length = 20)
    private String feeCabysCode;

    @Column(name = "fee_tax_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal feeTaxRate;

    @Column(name = "language", nullable = false, length = 10)
    private String language;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
