package taller.multimedia.backend.controller.onvo;

import taller.multimedia.backend.service.onvo.OnvoService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final OnvoService onvoService;

    @Value ("${payments.success.url}")
    private String paymentSuccessUrl;

    @Value ("${payments.cancel.url}")
    private String paymentCancelUrl;

    @PostMapping("/create-checkout-session")
    public ResponseEntity<?> createCheckoutSession(@RequestBody Map<String, String> request) {
        String priceId = request.get("priceId");
        
        // URLs a donde redirigirá Onvo al terminar o cancelar el pago
        String successUrl = this.paymentSuccessUrl;
        String cancelUrl = this.paymentCancelUrl;

        try {
            String paymentUrl = onvoService.createCheckoutLink(priceId, successUrl, cancelUrl);
            return ResponseEntity.ok(Map.of("url", paymentUrl));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}