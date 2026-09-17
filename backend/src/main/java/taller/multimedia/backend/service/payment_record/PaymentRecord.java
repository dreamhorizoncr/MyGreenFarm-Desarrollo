// package taller.multimedia.backend.service.payment_record;

// import jakarta.persistence.*;
// import lombok.*;
// import taller.multimedia.backend.model.parent.Parent;
// import taller.multimedia.backend.model.child.Child;
// import taller.multimedia.backend.model.service_plans.ServicePlan;

// import java.math.BigDecimal;
// import java.time.LocalDateTime;
// import java.util.UUID;

// @Entity
// @Table(name = "payment_records")
// @Data
// @NoArgsConstructor
// @AllArgsConstructor
// @Builder
// public class PaymentRecord {

//     @Id
//     @GeneratedValue(strategy = GenerationType.UUID)
//     private UUID id;

//     // 1. Relaciones (Quién paga, quién recibe, y qué se compró)
//     @ManyToOne(fetch = FetchType.LAZY)
//     @JoinColumn(name = "parent_id", nullable = false)
//     private Parent parent;

//     @ManyToOne(fetch = FetchType.LAZY)
//     @JoinColumn(name = "child_id", nullable = false)
//     private Child child;

//     @ManyToOne(fetch = FetchType.LAZY)
//     @JoinColumn(name = "service_plan_id", nullable = false)
//     private ServicePlan servicePlan;

//     // 2. Control de Montos (Para permitir el 50% o el 100%)
//     @Column(name = "total_amount", nullable = false)
//     private BigDecimal totalAmount; // Lo que cuesta el servicio completo

//     @Column(name = "paid_amount", nullable = false)
//     private BigDecimal paidAmount; // Lo que el cliente dio realmente (ej. la mitad)

//     // 3. Estados y Métodos
//     @Enumerated(EnumType.STRING)
//     @Column(name = "status", nullable = false)
//     private PaymentStatus status; // PENDING, PARTIAL, PAID

//     @Enumerated(EnumType.STRING)
//     @Column(name = "payment_method")
//     private PaymentMethod paymentMethod; // CASH, SINPE_DIRECT, ONVO_CARD, ONVO_SINPE

//     // 4. Rastreo para Onvo (Para cuando lo hagan por la web)
//     @Column(name = "gateway_session_id")
//     private String gatewaySessionId;

//     @Column(name = "created_at")
//     private LocalDateTime createdAt;
    
//     @PrePersist
//     protected void onCreate() {
//         this.createdAt = LocalDateTime.now();
//     }
// }