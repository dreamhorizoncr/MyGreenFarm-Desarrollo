package taller.multimedia.backend.repository.onvo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import taller.multimedia.backend.model.onvo.PaymentRecord;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, UUID> {
    
    // Permite al Webhook encontrar la compra usando el ID de la sesión que devuelve Onvo
    Optional<PaymentRecord> findByGatewaySessionId(String gatewaySessionId);

    Optional<PaymentRecord> findTopByGatewayPriceIdOrderByCreatedAtDesc(String gatewayPriceId);
}

