package taller.multimedia.backend.model.service_plans;

import java.math.BigDecimal;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table (name = "service_plan")
@Data 
@NoArgsConstructor 
@AllArgsConstructor 
public class ServicePlan {
    @Id  
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String description;

    @JsonIgnore
    @Column(name = "gateway_price_id", nullable = false)
    private String gatewayPriceId;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String imageUrl;

    @Column(name = "image_alt", length = 140)
    private String imageAlt;

    @Column(nullable = false)
    private BigDecimal price;

    @JsonIgnore
    @Column(name = "gateway_price_amount", precision = 14, scale = 2)
    private BigDecimal gatewayPriceAmount;
    
    @Column(nullable = false, length = 6)
    private String currency;

    @Column(nullable = false, length = 200)
    private String schedule;

    @Column(nullable = false, length = 800)
    private String includes;

    @Column(nullable = false)
    private boolean isActive;

    @JsonIgnore
    @Column(nullable = false)
    private String paymentUrl;

    @JsonIgnore
    @Column(name = "cabys_code", length = 20)
    private String cabysCode;

    @JsonIgnore
    @Column(name = "tax_rate", precision = 5, scale = 2)
    private BigDecimal taxRate;

    @JsonIgnore
    @Column(name = "coupon_id", columnDefinition = "TEXT")
    private String couponId;

    @JsonIgnore
    @Column(name = "coupon_code", length = 60)
    private String couponCode;

    @JsonIgnore
    @Column(name = "coupon_type", length = 20)
    private String couponType;

    @JsonIgnore
    @Column(name = "coupon_value", precision = 12, scale = 2)
    private BigDecimal couponValue;

    @JsonIgnore
    @Column(name = "coupon_expires_at")
    private java.time.LocalDate couponExpiresAt;

    @JsonIgnore
    @Column(name = "coupon_max_redemptions")
    private Integer couponMaxRedemptions;

    @JsonIgnore
    @Column(name = "coupon_redemptions")
    private Integer couponRedemptions;
}
