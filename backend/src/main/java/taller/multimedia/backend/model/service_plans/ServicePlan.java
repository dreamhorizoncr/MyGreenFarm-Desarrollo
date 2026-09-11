package taller.multimedia.backend.model.service_plans;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import taller.multimedia.backend.model.appointment.AppointmentStatus;

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

    @Column(name="stripe_price_id", nullable = false)
    private String stripePriceId;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String imageUrl;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private String schedule;

    @Column(nullable = false)
    private String includes;

    @Column(nullable = false)
    private boolean isActive;
}
