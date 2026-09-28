package taller.multimedia.backend.model.exchange_rate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Tasa de cambio de un día, publicada por un banco. Solo se guarda un registro
 * por fecha: el job scheduled hace upsert sobre el registro del día.
 */
@Entity
@Table(name = "exchange_rate")
@Data
@NoArgsConstructor
public class ExchangeRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rate_date", nullable = false, unique = true)
    private LocalDate rateDate;

    @Column(name = "usd_buy", nullable = false, precision = 14, scale = 6)
    private BigDecimal usdBuy;

    @Column(name = "usd_sell", nullable = false, precision = 14, scale = 6)
    private BigDecimal usdSell;

    @Column(name = "eur_buy", nullable = false, precision = 14, scale = 6)
    private BigDecimal eurBuy;

    @Column(name = "eur_sell", nullable = false, precision = 14, scale = 6)
    private BigDecimal eurSell;

    @Column(name = "source", nullable = false, length = 80)
    private String source;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
