package taller.multimedia.backend.service.electronic_billing;

import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriUtils;

@Service
public class ElectronicBillingService {
        private final RestTemplate restTemplate;

        @Value ("${electronic.bill.base-url}")
        private String baseUrl;
        
        @Value ("${electronic.bill.api-key}")
        private String apiKey;

        @Value ("${electronic.bill.api-secret-key}")
        private String apiSecretKey;

        public ElectronicBillingService(RestTemplate restTemplate) {
                this.restTemplate = restTemplate;
        }

        private HttpHeaders createHeaders(String idempotencyKey) {
                HttpHeaders headers = new HttpHeaders();
                headers.set("X-API-Key", apiKey);
                headers.set("X-API-Secret", apiSecretKey);
                headers.setContentType(MediaType.APPLICATION_JSON);
                if (idempotencyKey == null || idempotencyKey.isEmpty()) {
                        idempotencyKey = "pedido-" + LocalDate.now() + "-" + System.currentTimeMillis();
                }
                headers.set("Idempotency-Key", idempotencyKey);
                headers.set("Authorization", "Bearer " + apiKey);
                return headers;
        }

        private HttpHeaders createHeaders() {
                String defaultKey = "pedido-" + LocalDate.now() + "-" + System.currentTimeMillis();
                return createHeaders(defaultKey);
        }

        public Map searchCabysCatalog(String query) {
                String encodedQuery = UriUtils.encodeQueryParam(query, StandardCharsets.UTF_8);
                String url = baseUrl + "/v2/efactura/catalogs/cabys?q=" + encodedQuery + "&top=30";
                HttpEntity<String> entity = new HttpEntity<>(createHeaders());

                ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
                return response.getBody();
        }

        public Map emitInvoiceForSuccessfulPayment(
                        String clientName,
                        String clientEmail,
                        String identificationType,
                        String clientIdentification,
                        double totalAmount,
                        String serviceDescription,
                        String cabysCode,
                        double taxRate) {
                return emitInvoiceForSuccessfulPayment(
                                clientName,
                                clientEmail,
                                identificationType,
                                clientIdentification,
                                BigDecimal.valueOf(totalAmount),
                                serviceDescription,
                                cabysCode,
                                BigDecimal.valueOf(taxRate),
                                BigDecimal.ZERO,
                                null,
                                BigDecimal.ZERO,
                                "CRC",
                                null);
        }

        public Map emitInvoiceForSuccessfulPayment(
                        String clientName,
                        String clientEmail,
                        String identificationType,
                        String clientIdentification,
                        BigDecimal serviceAmount,
                        String serviceDescription,
                        String serviceCabysCode,
                        BigDecimal serviceTaxRate,
                        BigDecimal processingFeeAmount,
                        String processingFeeCabysCode,
                        BigDecimal processingFeeTaxRate,
                        String currency,
                        BigDecimal bacExchangeRate) {
                String cleanCurrency = currency != null ? currency.toUpperCase() : "CRC";
                String idempotencyKey = "pedido-" + LocalDate.now() + "-" + System.currentTimeMillis();

                String cleanIdentification = clientIdentification != null
                                ? clientIdentification.replaceAll("[^0-9]", "")
                                : "";

                List<Map<String, Object>> details = new ArrayList<>();
                details.add(createInvoiceLine(
                                serviceCabysCode,
                                serviceDescription,
                                serviceAmount,
                                serviceTaxRate));
                if (processingFeeAmount != null && processingFeeAmount.signum() > 0) {
                        if (processingFeeCabysCode == null || processingFeeCabysCode.isBlank()
                                        || processingFeeTaxRate == null) {
                                throw new IllegalStateException(
                                                "El cargo de pago requiere un CABYS y una tarifa de IVA configurados.");
                        }
                        details.add(createInvoiceLine(
                                        processingFeeCabysCode,
                                        "Cargo por procesamiento de pago",
                                        processingFeeAmount,
                                        processingFeeTaxRate));
                }

                Map<String, Object> invoicePayload = new HashMap<>();
                invoicePayload.put("emisorLegalId", "EMISORPRUEBA");
                invoicePayload.put("codigoActividad", "1071.9");
                invoicePayload.put("condicionVenta", "01");
                invoicePayload.put("medioPago", List.of("04"));
                invoicePayload.put("currency", currency);
                if ("USD".equalsIgnoreCase(cleanCurrency)) {
                if (bacExchangeRate == null || bacExchangeRate.compareTo(BigDecimal.ZERO) <= 0) {
                        throw new IllegalStateException("Se requiere un tipo de cambio del BAC válido para facturar en Dólares.");
                }
                invoicePayload.put("tipoCambio", bacExchangeRate);
                }
                invoicePayload.put("observaciones", "Pago procesado exitosamente mediante pasarela web");
                invoicePayload.put("receptor", Map.of(
                                "tipoIdentificacion", identificationType,
                                "numeroIdentificacion", cleanIdentification,
                                "nombre", clientName,
                                "correoElectronico", clientEmail));
                invoicePayload.put("detalle", details);

                String url = baseUrl + "/v2/efactura/documents/factura";

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(invoicePayload,
                                createHeaders(idempotencyKey));

                ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
                return response.getBody();
        }

        private Map<String, Object> createInvoiceLine(
                        String cabysCode,
                        String description,
                        BigDecimal unitAmount,
                        BigDecimal taxRate) {
                return Map.of(
                                "codigoCabys", cabysCode,
                                "cantidad", 1,
                                "unidadMedida", "Unid",
                                "detalle", description,
                                "precioUnitario", unitAmount,
                                "impuesto", List.of(
                                                Map.of(
                                                                "codigo", "01",
                                                                "codigoTarifa", taxCodeForRate(taxRate),
                                                                "tarifa", taxRate)));
        }

        private String taxCodeForRate(BigDecimal taxRate) {
                if (taxRate.compareTo(BigDecimal.ZERO) == 0) return "01";
                if (taxRate.compareTo(BigDecimal.ONE) == 0) return "02";
                if (taxRate.compareTo(BigDecimal.valueOf(2)) == 0) return "03";
                if (taxRate.compareTo(BigDecimal.valueOf(4)) == 0) return "04";
                if (taxRate.compareTo(BigDecimal.valueOf(8)) == 0) return "05";
                if (taxRate.compareTo(BigDecimal.valueOf(13)) == 0) return "06";
                throw new IllegalArgumentException("La tarifa de IVA no tiene un código CABYS soportado.");
        }

        public byte[] downloadPdfWithRetry(String documentId) {
                int maxRetries = 5;
                long waitTimeMs = 4000;
                
                for (int i = 0; i < maxRetries; i++) {
                        try {
                                String url = "https://api.facturaencr.com/v2/efactura/documents/" + documentId + "/pdf";

                                HttpHeaders headers = createHeaders();
                                headers.setAccept(java.util.List.of(MediaType.APPLICATION_PDF));

                                HttpEntity<String> entity = new HttpEntity<>(headers);

                                ResponseEntity<byte[]> response = restTemplate.exchange(
                                                url,
                                                HttpMethod.GET,
                                                entity,
                                                byte[].class);

                                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null
                                                && response.getBody().length > 0) {
                                        System.out.println("¡PDF de cortesía generado y descargado exitosamente!");
                                        return response.getBody();
                                }
                        } catch (org.springframework.web.client.HttpStatusCodeException e) {
                                if (e.getStatusCode().value() == 409) {
                                        System.out.println("PDF aún no disponible (409 Conflict), intento "
                                                        + (i + 1) + "/5, esperando...");
                                } else {
                                        System.err.println("Fallo HTTP " + e.getStatusCode() + " en intento "
                                                        + (i + 1) + "/5: " + e.getMessage());
                                }
                        } catch (Exception e) {
                                System.err.println(
                                                "Fallo General en intento " + (i + 1) + "/5: " + e.getMessage());
                        }

                        try {
                                Thread.sleep(waitTimeMs);
                        } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                                break;
                        }
                }
                System.err.println("No se pudo obtener el PDF tras varios intentos.");
                return null;
        }
}
