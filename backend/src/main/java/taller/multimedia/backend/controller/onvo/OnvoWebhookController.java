package taller.multimedia.backend.controller.onvo;

import java.math.BigDecimal;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.model.onvo.PaymentRecord;
import taller.multimedia.backend.model.onvo.PaymentStatus;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.onvo.PaymentRecordRepository;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;

@RestController 
@RequestMapping ("/api/webhooks")
@RequiredArgsConstructor
public class OnvoWebhookController {

    private ServicePlanRepository servicePlanRepository;
    private final PaymentRecordRepository paymentRecordRepository;

    @PostMapping("/onvo")
    public ResponseEntity<String> handleOnvoWebhook(@RequestBody Map<String, Object> payload) {
        String eventType = (String) payload.get("type");
        Map<String, Object> data = (Map<String, Object>) payload.get("data");

        if (data == null) {
            return ResponseEntity.ok("Received");
        }

        // 1. Si el pago web fue exitoso
        if ("checkout.session.completed".equals(eventType) || "payment.successful".equals(eventType)) {
            String gatewaySessionId = (String) data.get("id");
            System.out.println("Pago recibido por pasarela para la sesión: " + gatewaySessionId);

            // Buscamos el registro que se creó previamente en estado PENDING con este ID de sesión
            PaymentRecord paymentRecord = paymentRecordRepository.findByGatewaySessionId(gatewaySessionId).orElse(null);

            if (paymentRecord != null) {
                paymentRecord.setStatus(PaymentStatus.PAID);
                paymentRecord.setPaidAmount(paymentRecord.getTotalAmount()); // Pago completado al 100%
                paymentRecordRepository.save(paymentRecord);
                
                System.out.println("¡Estado de pago actualizado a PAID para el registro ID: " + paymentRecord.getId() + "!");
                // Opcional: Aquí puedes disparar el envío de correo con Resend notificando la compra
            } else {
                System.out.println("Aviso: No se encontró ningún PaymentRecord asociado al gateway_session_id: " + gatewaySessionId);
            }
        }

        // 2. Si se editó el precio/producto directamente en el panel de OnvoPay
        if ("price.updated".equals(eventType) || "product.updated".equals(eventType)) {
            String gatewayPriceId = (String) data.get("id");
            
            ServicePlan plan = servicePlanRepository.findByGatewayPriceId(gatewayPriceId).orElse(null);
            
            if (plan != null) {
                if (data.get("name") != null) {
                    plan.setName((String) data.get("name"));
                }
                if (data.get("description") != null) {
                    plan.setDescription((String) data.get("description"));
                }
                if (data.get("amount") != null) {
                    plan.setPrice(new BigDecimal(data.get("amount").toString()));
                }
                
                servicePlanRepository.save(plan);
                System.out.println("Plan sincronizado automáticamente por webhook: " + gatewayPriceId);
            }
        }

        return ResponseEntity.ok("Received");
    }
}