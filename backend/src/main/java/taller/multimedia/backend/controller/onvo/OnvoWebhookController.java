package taller.multimedia.backend.controller.onvo;

import java.math.BigDecimal;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;

@RestController 
@RequestMapping ("/api/webhooks")
public class OnvoWebhookController {

    private ServicePlanRepository servicePlanRepository;

    @PostMapping("/onvo")
    public ResponseEntity<String> handleOnvoWebhook(@RequestBody Map<String, Object> payload) {
        String eventType = (String) payload.get("type");
        Map<String, Object> data = (Map<String, Object>) payload.get("data");

        if (data == null) {
            return ResponseEntity.ok("Received");
        }

        // 1. Si el pago fue exitoso
        if ("checkout.session.completed".equals(eventType) || "payment.successful".equals(eventType)) {
            System.out.println("Pago recibido para la transacción: " + data.get("id"));
            // Lógica para activar el servicio o matrícula del niño y padre (ESTO IRÁ MÁS ADELANTE)
        }

        // 2. Si editó el precio/producto directamente en el panel de OnvoPay
        if ("price.updated".equals(eventType) || "product.updated".equals(eventType)) {
            String gatewayPriceId = (String) data.get("id"); // O el campo que devuelva Onvo para identificar el precio
            
            // Buscamos si tenemos este precio guardado en Supabase
            ServicePlan plan = servicePlanRepository.findByGatewayPriceId(gatewayPriceId).orElse(null);
            
            if (plan != null) {
                // Actualizamos los datos locales automáticamente con lo que vino de Onvo
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
                System.out.println("Plan sincronizado automáticamente por webhook debido a cambio en Onvo: " + gatewayPriceId);
            }
        }

        return ResponseEntity.ok("Received");
    }
}