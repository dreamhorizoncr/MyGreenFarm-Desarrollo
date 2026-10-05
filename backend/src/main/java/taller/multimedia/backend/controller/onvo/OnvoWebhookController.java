package taller.multimedia.backend.controller.onvo;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class OnvoWebhookController {


    @PostMapping("/onvo")
    public ResponseEntity<String> handleOnvoWebhook(@RequestBody Map<String, Object> payload) {
        System.out.println("¡Webhook recibido con éxito!");
        String eventType = (String) payload.get("type");
        Map<String, Object> data = (Map<String, Object>) payload.get("data");

        if (data == null) {
            return ResponseEntity.ok("Received");
        }

        System.out.println("Estoy en el onvo ");

        boolean paymentSucceeded = "checkout-session.succeeded".equals(eventType)
                || "checkout.session.completed".equals(eventType)
                || "payment.successful".equals(eventType);
        boolean paymentFailed = "checkout-session.failed".equals(eventType)
                || "checkout-session.expired".equals(eventType)
                || "payment-intent.failed".equals(eventType);

        if (paymentSucceeded || paymentFailed) {
            Object metadataValue = data.get("metadata");
            String gatewaySessionId = null;

            if (metadataValue instanceof Map<?, ?> metadata) {
                Object sessionIdValue = metadata.get("gatewaySessionId");
                gatewaySessionId = sessionIdValue == null ? null : sessionIdValue.toString();
            }

            if (gatewaySessionId == null || gatewaySessionId.isEmpty()) {
                gatewaySessionId = (String) data.get("id");
            }

        }

        return ResponseEntity.ok("Received");
    }
}