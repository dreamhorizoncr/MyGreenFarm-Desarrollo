package taller.multimedia.backend.service.onvo;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;

import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class OnvoService {

    @Value("${onvo.api.key}")
    private String onvoApiKey; 

    @Value("${onvo.api.url}")
    private String onvoApiUrl; 

    private final RestTemplate restTemplate;

    public String createCheckoutLink(String priceId, String successUrl, String cancelUrl) {
        String url = onvoApiUrl + "/checkouts"; 

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(onvoApiKey);

        // Estructura del payload que pide Onvo
        Map<String, Object> body = Map.of(
            "price_id", priceId,
            "success_url", successUrl,
            "cancel_url", cancelUrl
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // Extrae la URL de pago que devuelve Onvo
                return (String) response.getBody().get("url");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error al generar el link de pago con Onvo: " + e.getMessage());
        }
        
        throw new RuntimeException("No se pudo obtener la URL de pago de Onvo.");
    }
}