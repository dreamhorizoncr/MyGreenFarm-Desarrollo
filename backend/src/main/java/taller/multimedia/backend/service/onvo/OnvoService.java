package taller.multimedia.backend.service.onvo;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.service.EmailService;
import taller.multimedia.backend.service.electronic_billing.ElectronicBillingService;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class OnvoService {

    @Value("${onvo.api.key}")
    private String onvoApiKey;

    @Value("${onvo.api.url}")
    private String onvoApiUrl;

    private final RestTemplate restTemplate;

    private final ElectronicBillingService electronicBillingService;

    private final EmailService emailService;

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(onvoApiKey.trim());
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    public String createCheckoutLink(String priceId, String successUrl, String cancelUrl) {
        String url = onvoApiUrl + "/checkouts";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(onvoApiKey);

        Map<String, Object> body = Map.of(
                "price_id", priceId,
                "success_url", successUrl,
                "cancel_url", cancelUrl);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (String) response.getBody().get("url");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error al generar el link de pago con Onvo: " + e.getMessage());
        }

        throw new RuntimeException("No se pudo obtener la URL de pago de Onvo.");
    }

    public String createCheckoutSession(double amount, String currency, String email, String name) {
        String url = onvoApiUrl + "/checkout/sessions";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(onvoApiKey.trim());
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("amountTotal", (int) amount);
        requestBody.put("currency", currency.toUpperCase());
        requestBody.put("customerEmail", email);
        requestBody.put("customerName", name);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

        if (response.getBody() != null) {
            return (String) response.getBody().get("url");
        }
        throw new RuntimeException("No se pudo obtener la URL de pago de Onvo");
    }

    public Map<String, Object> getPriceDetails(String priceId) {
        String url = onvoApiUrl + "/prices/" + priceId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(onvoApiKey.trim());

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

        if (response.getBody() != null) {
            return response.getBody();
        }
        throw new RuntimeException("No se pudo obtener el servicio de Onvo.");
    }

    public Map<String, Object> createPaymentIntentFromPrice(String priceId, String customerEmail, String description) {
        Map<String, Object> priceInfo = getPriceDetails(priceId);

        Number unitAmount = (Number) priceInfo.get("unitAmount");
        String currency = ((String) priceInfo.get("currency")).toUpperCase();

        if (unitAmount == null) {
            throw new RuntimeException("El precio de Onvo no contiene un monto válido.");
        }

        String url = onvoApiUrl + "/payment-intents";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(onvoApiKey.trim());
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = Map.of(
                "amount", unitAmount.intValue(),
                "currency", currency,
                "description", description);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

        if (response.getBody() != null) {
            return response.getBody();
        }
        throw new RuntimeException("No se pudo crear la intención de pago en Onvo");
    }

    public Map<String, Object> confirmPaymentIntentWithCard(
            String paymentIntentId,
            String cardNumber,
            Integer expMonth,
            Integer expYear,
            String cvc,
            String cardHolder,
            String clientName,
            String clientEmail,
            String identificationType,
            String clientIdentification,
            double totalAmount,
            String description,
            String cabysCode,
            double taxRate,
            String language) {

        String paymentMethodUrl = onvoApiUrl + "/payment-methods";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(onvoApiKey.trim());
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> cardData = Map.of(
                "number", cardNumber.replaceAll("\\s+", ""),
                "expMonth", expMonth,
                "expYear", expYear,
                "cvv", cvc,
                "holderName", cardHolder);

        Map<String, Object> paymentMethodBody = Map.of(
                "type", "card",
                "card", cardData);

        HttpEntity<Map<String, Object>> pmEntity = new HttpEntity<>(paymentMethodBody, headers);

        try {
            ResponseEntity<Map> pmResponse = restTemplate.exchange(paymentMethodUrl, HttpMethod.POST, pmEntity,
                    Map.class);

            if (pmResponse.getBody() == null || !pmResponse.getBody().containsKey("id")) {
                throw new RuntimeException("No se pudo generar el método de pago en Onvo");
            }

            String paymentMethodId = (String) pmResponse.getBody().get("id");

            String confirmUrl = onvoApiUrl + "/payment-intents/" + paymentIntentId + "/confirm";

            Map<String, Object> confirmBody = Map.of(
                    "paymentMethodId", paymentMethodId);

            HttpEntity<Map<String, Object>> confirmEntity = new HttpEntity<>(confirmBody, headers);
            ResponseEntity<Map> confirmResponse = restTemplate.exchange(confirmUrl, HttpMethod.POST, confirmEntity,
                    Map.class);

            Map<String, Object> responseBody = confirmResponse.getBody();

            String paymentStatus = responseBody != null ? (String) responseBody.get("status") : null;

            if (paymentStatus != null && "succeeded".equalsIgnoreCase(paymentStatus.trim())) {
                try {
                    Map<String, Object> invoiceResponse = electronicBillingService.emitInvoiceForSuccessfulPayment(
                            clientName, clientEmail, identificationType, clientIdentification, totalAmount, description,
                            cabysCode, taxRate);

                    emailService.sendInvoiceWithPdf(clientEmail, clientName, invoiceResponse,
                            Locale.forLanguageTag(language == null ? "es" : language));

                    log.info("Proceso de factura e correo iniciado en segundo plano para: {}", clientEmail);

                } catch (Exception e) {
                    log.error("¡ERROR CRÍTICO AL INICIAR FACTURA/CORREO!: {}", e.getMessage());
                    e.printStackTrace();
                }
            } else {
                log.info("El pago NO fue exitoso. Status: " + paymentStatus);
            }

            return confirmResponse.getBody();

        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Error al procesar el pago con Onvo: " + e.getResponseBodyAsString());
        }
    }

    public Map<String, Object> confirmPaymentIntentWithSinpe(
            String paymentIntentId,
            String phoneNumber,
            String sinpeReference,
            String clientName,
            String clientEmail,
            String identificationType,
            String clientIdentification,
            double totalAmount,
            String description,
            String cabysCode,
            double taxRate,
            String language,
            String currency) {

        if (currency != null && "USD".equalsIgnoreCase(currency.trim())) {
            throw new IllegalArgumentException(
                    "El método de pago SINPE no está disponible para transacciones en Dólares (USD).");
        }

        String paymentMethodUrl = onvoApiUrl + "/payment-methods";

        String cleanDigits = phoneNumber.replaceAll("[^0-9]", "");

        String formattedPhone;
        if (cleanDigits.startsWith("506") && cleanDigits.length() == 11) {
            formattedPhone = "+" + cleanDigits;
        } else if (cleanDigits.length() == 8) {
            formattedPhone = "+506" + cleanDigits;
        } else {
            formattedPhone = "+" + cleanDigits;
        }

        Map<String, Object> mobileData = Map.of(
                "number", formattedPhone,
                "identificationType", 1,
                "identification", "101110111");

        Map<String, Object> paymentMethodBody = Map.of(
                "type", "mobile_number",
                "mobileNumber", mobileData);

        HttpEntity<Map<String, Object>> pmEntity = new HttpEntity<>(paymentMethodBody, buildHeaders());

        try {
            ResponseEntity<Map> pmResponse = restTemplate.exchange(
                    paymentMethodUrl, HttpMethod.POST, pmEntity, Map.class);

            if (pmResponse.getBody() == null || !pmResponse.getBody().containsKey("id")) {
                throw new RuntimeException("No se pudo generar el método de pago SINPE en Onvo");
            }

            String paymentMethodId = (String) pmResponse.getBody().get("id");

            String confirmUrl = onvoApiUrl + "/payment-intents/" + paymentIntentId + "/confirm";
            Map<String, Object> confirmBody = Map.of("paymentMethodId", paymentMethodId);

            HttpEntity<Map<String, Object>> confirmEntity = new HttpEntity<>(confirmBody, buildHeaders());
            ResponseEntity<Map> confirmResponse = restTemplate.exchange(
                    confirmUrl, HttpMethod.POST, confirmEntity, Map.class);

            Map<String, Object> responseBody = confirmResponse.getBody();

            String paymentStatus = responseBody != null ? (String) responseBody.get("status") : null;

            if (paymentStatus != null && "succeeded".equalsIgnoreCase(paymentStatus.trim())) {
                try {
                    Map<String, Object> invoiceResponse = electronicBillingService.emitInvoiceForSuccessfulPayment(
                            clientName, clientEmail, identificationType, clientIdentification, totalAmount, description,
                            cabysCode, taxRate);

                    emailService.sendInvoiceWithPdf(clientEmail, clientName, invoiceResponse,
                            Locale.forLanguageTag(language == null ? "es" : language));

                    log.info("Proceso de factura e correo iniciado en segundo plano para: {}", clientEmail);

                } catch (Exception e) {
                    log.error("¡ERROR CRÍTICO AL INICIAR FACTURA/CORREO!: {}", e.getMessage());
                    e.printStackTrace();
                }
            } else {
                log.info("El pago NO fue exitoso. Status: " + paymentStatus);
            }

            return confirmResponse.getBody();

        } catch (HttpStatusCodeException e) {
            throw new RuntimeException("Error al procesar el pago SINPE con Onvo: " + e.getResponseBodyAsString());
        }
    }
}