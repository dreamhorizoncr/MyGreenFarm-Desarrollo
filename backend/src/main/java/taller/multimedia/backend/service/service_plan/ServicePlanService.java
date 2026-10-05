package taller.multimedia.backend.service.service_plan;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import taller.multimedia.backend.dto.service_plan.ServicePlanRequest;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServicePlanService {

    private final ServicePlanRepository servicePlanRepository;
    private final ServicePlanImageService servicePlanImagesService;
    private final RestTemplate restTemplate;

    @Value("${onvo.api.key}")
    private String onvoApiKey;

    @Value("${onvo.api.url}")
    private String onvoApiUrl;

    @Transactional(readOnly = true)
    public List<ServicePlan> getAllPlans() {
        return servicePlanRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ServicePlan> getActivePlans() {
        return servicePlanRepository.findByIsActiveTrue();
    }

    @Transactional(readOnly = true)
    public ServicePlan getPlanById(UUID id) {
        return servicePlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Configuración de plan no encontrada con ID: " + id));
    }

    @Transactional
    public ServicePlan createPlan(ServicePlanRequest dto, MultipartFile file) {
        if (servicePlanRepository.existsByGatewayPriceId(dto.getGatewayPriceId())) {
            throw new IllegalArgumentException("Ya existe un plan de servicio registrado en Onvo.");
        }

        // 1. Buscamos la info completa usando tu método maestro de Onvo
        List<Map<String, Object>> onvoPlans = getPlansFromOnvo();
        Map<String, Object> targetOnvoPlan = onvoPlans.stream()
                .filter(p -> dto.getGatewayPriceId().equals(p.get("gatewayPriceId")))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "No se encontró el precio con ID: " + dto.getGatewayPriceId() + " en OnvoPay"));

        // 2. Llenamos el DTO con los datos reales que faltaban para que no viajen en
        // null
        dto.setName((String) targetOnvoPlan.get("name"));

        String desc = (String) targetOnvoPlan.get("description");
        dto.setDescription(desc != null && !desc.isEmpty() ? desc : "Sin descripción");

        Object priceObj = targetOnvoPlan.get("price");
        dto.setPrice(priceObj != null ? new BigDecimal(priceObj.toString()) : BigDecimal.ZERO);

        String currency = targetOnvoPlan.get("currency") != null ? targetOnvoPlan.get("currency").toString() : "CRC";
        dto.setCurrency(currency);

        dto.setType(
                targetOnvoPlan.get("type") != null ? targetOnvoPlan.get("type").toString().toUpperCase() : "ONE_TIME");
        String realCheckoutUrl = generateCheckoutUrl(dto.getGatewayPriceId());
        dto.setPaymentUrl(realCheckoutUrl);

        // 3. Se lo pasamos al servicio de imágenes para que suba el archivo y guarde
        return servicePlanImagesService.createPlanWithImage(dto, file);
    }

    @Transactional
    public ServicePlan updatePlan(UUID id, ServicePlanRequest dto, MultipartFile file) {
        return servicePlanImagesService.updatePlanWithImage(id, dto, file);
    }

    @Transactional
    public void deletePlan(UUID id) {
        servicePlanImagesService.deletePlan(id);
    }

    // Trae los planes/productos desde la API de OnvoPay para alimentar el dropdown
    // del frontend.
    public List<Map<String, Object>> getPlansFromOnvo() {
        List<Map<String, Object>> plansList = new ArrayList<>();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(onvoApiKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            // 1. Obtener productos y mapearlos por ID
            Map<String, Map<String, Object>> prodMap = new HashMap<>();
            long productsRequestStart = System.currentTimeMillis();
            ResponseEntity<Map> prodRes = restTemplate.exchange(onvoApiUrl + "/products", HttpMethod.GET, entity,
                    Map.class);
            log.info("Consultar productos de Onvo tardó: {} ms", System.currentTimeMillis() - productsRequestStart);
            if (prodRes.getBody() != null && prodRes.getBody().get("data") != null) {
                for (Map<String, Object> p : (List<Map<String, Object>>) prodRes.getBody().get("data")) {
                    prodMap.put((String) p.get("id"), p);
                }
            }

            long pricesRequestStart = System.currentTimeMillis();
            ResponseEntity<Map> priceRes = restTemplate.exchange(onvoApiUrl + "/prices", HttpMethod.GET, entity,
                    Map.class);
            log.info("Consultar precios de Onvo tardó: {} ms", System.currentTimeMillis() - pricesRequestStart);


            if (priceRes.getBody() != null && priceRes.getBody().get("data") != null) {
                for (Map<String, Object> item : (List<Map<String, Object>>) priceRes.getBody().get("data")) {
                    Map<String, Object> prod = prodMap.getOrDefault(item.get("productId"), Collections.emptyMap());

                    if (isArchivedOrInactive(item) || isArchivedOrInactive(prod)) {
                        continue;
                    }

                    Map<String, Object> info = new HashMap<>();
                    info.put("gatewayPriceId", item.get("id"));
                    info.put("name", prod.get("name"));
                    info.put("description", prod.get("description"));
                    info.put("currency",
                            item.get("currency") != null ? item.get("currency").toString().toUpperCase() : "CRC");

                    // Precio en formato decimal
                    Object amount = item.get("unitAmount");
                    double price = amount != null ? Double.parseDouble(amount.toString()) / 100.0 : 0.0;
                    info.put("price", price);

                    // Mapeo inteligente y limpio del tipo de plan (Enum compatible)
                    String mappedType = "ONE_TIME";
                    Object recurringObj = item.get("recurring");

                    if (recurringObj instanceof Map) {
                        Map<String, Object> rec = (Map<String, Object>) recurringObj;
                        String interval = String.valueOf(rec.get("interval")).toLowerCase();
                        int count = rec.get("intervalCount") != null
                                ? Integer.parseInt(rec.get("intervalCount").toString())
                                : 1;

                        mappedType = switch (interval) {
                            case "week" -> count == 2 ? "TWO_WEEKS" : (count == 1 ? "WEEKLY" : "CUSTOM_WEEKLY");
                            case "month" -> switch (count) {
                                case 1 -> "MONTHLY";
                                case 6 -> "SIX_MONTHS";
                                default -> "CUSTOM_MONTHLY";
                            };
                            case "year", "annual" -> "ANNUALLY";
                            case "day" -> "DAILY";
                            default -> "CUSTOM";
                        };
                    }
                    info.put("type", mappedType);

                    plansList.add(info);
                }
            }
        } catch (Exception e) {
            System.err.println("Error al consultar Onvo: " + e.getMessage());
        }

        return plansList;
    }

    // Une lo que viene de OnvoPay con la imagen, horarios y detalles guardados en
    // Supabase.
    public List<Map<String, Object>> getFullEnrichedPlans() {
        List<Map<String, Object>> onvoPlans = getPlansFromOnvo();
        List<ServicePlan> localPlans = servicePlanRepository.findAll();

        for (Map<String, Object> onvoPlan : onvoPlans) {
            // CORREGIDO: Usamos "gatewayPriceId" en lugar de "priceId"
            String priceId = (String) onvoPlan.get("gatewayPriceId");

            ServicePlan match = localPlans.stream()
                    .filter(p -> p.getGatewayPriceId() != null && p.getGatewayPriceId().equals(priceId))
                    .findFirst()
                    .orElse(null);

            if (match != null) {
                onvoPlan.put("id", match.getId()); // minúscula para mantener consistencia REST
                onvoPlan.put("imageUrl", match.getImageUrl());
                onvoPlan.put("schedule", match.getSchedule());
                onvoPlan.put("includes", match.getIncludes());
            } else {
                onvoPlan.put("imageUrl", null);
                onvoPlan.put("schedule", "No asignado");
                onvoPlan.put("includes", "");
            }
        }

        return onvoPlans;
    }

    private Map<String, String> generateCheckoutUrlInternal(String gatewayPriceId) {
        if (gatewayPriceId == null || gatewayPriceId.isEmpty()) {
            throw new IllegalStateException("Este plan no tiene asociado un precio de OnvoPay.");
        }

        String url = onvoApiUrl + "/checkout/sessions/one-time-link";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(onvoApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();

        List<Map<String, Object>> lineItems = new ArrayList<>();
        Map<String, Object> item = new HashMap<>();
        item.put("priceId", gatewayPriceId);
        item.put("quantity", 1);
        lineItems.add(item);

        requestBody.put("lineItems", lineItems);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                String checkoutUrl = (String) body.get("url");
                String realOnvoId = (String) body.get("id");

                return Map.of(
                        "url", checkoutUrl != null ? checkoutUrl : "",
                        "gatewaySessionId", realOnvoId != null ? realOnvoId : "");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error al comunicarse con OnvoPay: " + e.getMessage());
        }

        throw new RuntimeException("No se pudo obtener el enlace de pago de OnvoPay.");
    }

    public String generateCheckoutUrl(String gatewayPriceId) {
        return generateCheckoutUrlInternal(gatewayPriceId).get("url");
    }

    public Map<String, String> createCheckoutSessionForPlan(UUID planId) {
        ServicePlan plan = getPlanById(planId);
        String gatewayPriceId = plan.getGatewayPriceId();

        // Solo genera la sesión en Onvo y retorna los datos al frontend
        return generateCheckoutUrlInternal(gatewayPriceId);
    }

    public Map<String, String> createPaymentIntentOrCheckout(UUID planId) {
        return createCheckoutSessionForPlan(planId);
    }

    // 1. Consulta directa a la API de Onvo para verificar si la sesión ya fue
    // pagada
    public boolean checkStatusDirectlyFromOnvo(String gatewaySessionId) {
        if (gatewaySessionId == null || gatewaySessionId.isEmpty()) {
            return false;
        }

        String url = onvoApiUrl + "/checkout/sessions/" + gatewaySessionId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(onvoApiKey);
        log.info("URL consultada a Onvo: {}", url);
        log.info("API Key usada (primeros caracteres): {}",
                onvoApiKey != null && onvoApiKey.length() > 5 ? onvoApiKey.substring(0, 5) + "..." : "NULL O VACÍA");
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();

                String status = (String) body.get("status");
                Boolean isPaid = (Boolean) body.get("paid");

                return "completed".equalsIgnoreCase(status)
                        || "paid".equalsIgnoreCase(status)
                        || (isPaid != null && isPaid);
            }
        } catch (Exception e) {
            log.error("Error al consultar directamente el estado en OnvoPay: {}", e.getMessage());
        }
        return false;
    }

}