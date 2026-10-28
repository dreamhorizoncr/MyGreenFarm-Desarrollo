package taller.multimedia.backend.service.service_plan;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import taller.multimedia.backend.dto.service_plan.ServicePlanRequest;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;
import taller.multimedia.backend.service.electronic_billing.ElectronicBillingService;
import taller.multimedia.backend.repository.exchange_rate.ExchangeRateRepository;
import taller.multimedia.backend.model.exchange_rate.ExchangeRate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
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
    private final ElectronicBillingService electronicBillingService;
    private final ExchangeRateRepository exchangeRateRepository;

    @Value("${onvo.api.key}")
    private String onvoApiKey;

    @Value("${onvo.api.url}")
    private String onvoApiUrl;

    @Value("${onvo.fees.card.percentage:3.9}")
    private BigDecimal cardFeePercentage;

    @Value("${onvo.fees.card.fixed-usd:0.35}")
    private BigDecimal cardFixedFeeUsd;

    @Transactional
    public List<ServicePlan> getAllPlans() {
        return populateGatewayPriceAmounts(servicePlanRepository.findAll());
    }

    @Transactional
    public List<ServicePlan> getActivePlans() {
        return populateGatewayPriceAmounts(servicePlanRepository.findByIsActiveTrue());
    }

    private List<ServicePlan> populateGatewayPriceAmounts(List<ServicePlan> plans) {
        List<ServicePlan> updatedPlans = plans.stream()
                .filter(plan -> plan.getGatewayPriceAmount() == null)
                .toList();
        if (updatedPlans.isEmpty())
            return plans;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(onvoApiKey.trim());
        HttpEntity<Void> request = new HttpEntity<>(headers);
        for (ServicePlan plan : updatedPlans) {
            ResponseEntity<Map> response = restTemplate.exchange(
                    onvoApiUrl + "/prices/" + plan.getGatewayPriceId(),
                    HttpMethod.GET,
                    request,
                    Map.class);
            Object rawAmount = response.getBody() == null ? null : response.getBody().get("unitAmount");
            if (!(rawAmount instanceof Number amount)) {
                throw new IllegalStateException("Onvo no devolvió un importe válido para el precio del servicio.");
            }
            plan.setGatewayPriceAmount(BigDecimal.valueOf(amount.longValue(), 2));
            servicePlanRepository.save(plan);
        }
        return plans;
    }

    @Transactional(readOnly = true)
    public ServicePlan getPlanById(UUID id) {
        return servicePlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Configuración de plan no encontrada con ID: " + id));
    }

    @Transactional
    public ServicePlan createPlan(ServicePlanRequest dto, MultipartFile file) {
        if (file != null && file.getOriginalFilename() != null && file.getOriginalFilename().length() > 255) {
            throw new IllegalArgumentException(
                    "El nombre del archivo de la imagen es demasiado largo (máximo 255 caracteres).");
        }
        validateRequest(dto);
        CabysDetails cabys = findCabys(dto.getCabysCode());
        dto.setCabysCode(cabys.code());
        dto.setTaxRate(cabys.taxRate());

        if (dto.getCouponCode() != null && !dto.getCouponCode().isBlank()) {
            validateCoupon(dto, dto.getPrice());
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(onvoApiKey.trim());
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            Map<String, Object> productBody = Map.of(
                    "name", dto.getName(),
                    "description", dto.getDescription());
            ResponseEntity<Map> prodResponse = restTemplate.exchange(
                    onvoApiUrl + "/products", HttpMethod.POST, new HttpEntity<>(productBody, headers), Map.class);

            if (prodResponse.getBody() == null || !prodResponse.getBody().containsKey("id")) {
                throw new RuntimeException("No se pudo crear el producto en OnvoPay.");
            }
            String productId = (String) prodResponse.getBody().get("id");

            boolean isRecurring = isRecurring(dto.getType());
            BigDecimal onvoPrice = isRecurring
                    ? calculateRecurringPrice(dto.getPrice(), cabys.taxRate(), dto.getCurrency())
                    : dto.getPrice();
            long unitAmountCents = toMinorUnits(onvoPrice);
            Map<String, Object> priceBody = new HashMap<>();
            priceBody.put("productId", productId);
            priceBody.put("unitAmount", unitAmountCents);
            priceBody.put("currency", dto.getCurrency().toUpperCase());

            if (isRecurring) {
                priceBody.put("type", "recurring");
                priceBody.put("recurring", recurringInterval(dto.getType()));
            } else {
                priceBody.put("type", "one_time");
            }

            ResponseEntity<Map> priceResponse = restTemplate.exchange(
                    onvoApiUrl + "/prices", HttpMethod.POST, new HttpEntity<>(priceBody, headers), Map.class);

            if (priceResponse.getBody() == null || !priceResponse.getBody().containsKey("id")) {
                throw new RuntimeException("No se pudo crear el precio en OnvoPay.");
            }
            String gatewayPriceId = (String) priceResponse.getBody().get("id");
            Object gatewayPriceAmount = priceResponse.getBody().get("unitAmount");
            if (!(gatewayPriceAmount instanceof Number amount)) {
                throw new IllegalStateException("Onvo no devolvió el importe del precio creado.");
            }

            dto.setGatewayPriceId(gatewayPriceId);
            dto.setGatewayPriceAmount(BigDecimal.valueOf(amount.longValue(), 2));
            dto.setPaymentUrl("");

            createOnvoCouponIfConfigured(dto, headers, dto.getName(), dto.getCurrency());

            return servicePlanImagesService.createPlanWithImage(dto, file);

        } catch (HttpClientErrorException e) {
            log.error("Error de Onvo al crear plan: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Error al registrar el servicio en OnvoPay: " + e.getResponseBodyAsString());
        }
    }

    private void validateRequest(ServicePlanRequest dto) {
        if (dto.getName() == null || dto.getName().isBlank()
                || dto.getDescription() == null || dto.getDescription().isBlank()
                || dto.getPrice() == null || dto.getPrice().signum() <= 0
                || dto.getType() == null || dto.getType().isBlank()
                || dto.getCurrency() == null || !List.of("CRC", "USD").contains(dto.getCurrency().toUpperCase())) {
            throw new IllegalArgumentException("Complete el nombre, descripción, precio, tipo y moneda del servicio.");
        }
        boolean hasCoupon = dto.getCouponCode() != null && !dto.getCouponCode().isBlank();
        if (hasCoupon) {
            validateCoupon(dto, dto.getPrice());
        } else if (dto.getCouponType() != null || dto.getCouponValue() != null
                || dto.getCouponExpiresAt() != null || dto.getCouponMaxRedemptions() != null) {
            throw new IllegalArgumentException("Complete el código del cupón o elimine sus datos.");
        }
    }

    private void validateCoupon(ServicePlanRequest dto, BigDecimal servicePrice) {
        if (dto.getCouponValue() == null || dto.getCouponValue().signum() <= 0
                || !List.of("percent_off", "amount_off").contains(dto.getCouponType())) {
            throw new IllegalArgumentException("El cupón requiere código, tipo y valor válidos.");
        }
        if ("percent_off".equals(dto.getCouponType())
                && dto.getCouponValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("El descuento porcentual no puede superar el 100%.");
        }
        if ("amount_off".equals(dto.getCouponType())
                && dto.getCouponValue().compareTo(servicePrice) >= 0) {
            throw new IllegalArgumentException("El descuento fijo debe ser menor al precio del servicio.");
        }
        if (dto.getCouponExpiresAt() != null && !dto.getCouponExpiresAt().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La fecha de vencimiento del cupón debe ser futura.");
        }
    }

    private CabysDetails findCabys(String cabysCode) {
        if (cabysCode == null || cabysCode.isBlank()) {
            throw new IllegalArgumentException("Seleccione un código CABYS para el servicio.");
        }
        Map<String, Object> result = electronicBillingService.searchCabysCatalog(cabysCode);
        Object rawItems = result == null ? null : result.get("items");
        if (!(rawItems instanceof List<?>) && result != null) {
            rawItems = result.get("data");
        }
        List<?> items = rawItems instanceof List<?> resultItems
                ? resultItems
                : result != null && result.containsKey("codigo") ? List.of(result) : List.of();
        if (items.isEmpty()) {
            throw new IllegalStateException("No se pudo validar el código CABYS seleccionado.");
        }
        for (Object item : items) {
            if (item instanceof Map<?, ?> match && cabysCode.equals(String.valueOf(match.get("codigo")))) {
                Object rawTaxRate = match.get("impuesto");
                if (rawTaxRate == null) {
                    throw new IllegalStateException("El código CABYS no incluye su tarifa de IVA.");
                }
                BigDecimal taxRate = new BigDecimal(rawTaxRate.toString());
                if (!List.of(0, 1, 2, 4, 8, 13).contains(taxRate.intValue())
                        || taxRate.compareTo(BigDecimal.valueOf(taxRate.intValue())) != 0) {
                    throw new IllegalStateException("La tarifa de IVA CABYS no está soportada.");
                }
                return new CabysDetails(cabysCode, taxRate);
            }
        }
        throw new IllegalArgumentException("El código CABYS seleccionado no existe en el catálogo.");
    }

    private void createOnvoCouponIfConfigured(
            ServicePlanRequest dto,
            HttpHeaders headers,
            String serviceName,
            String currency) {
        if (dto.getCouponCode() == null || dto.getCouponCode().isBlank()) {
            return;
        }

        String rawType = dto.getCouponType();
        String onvoType = "percentage";
        if (rawType != null && (rawType.contains("amount") || rawType.contains("fixed"))) {
            onvoType = "fixed_amount";
        }

        String codeNormalized = dto.getCouponCode().trim().toUpperCase();

        // Estructura exacta alineada al JSON que soporta Onvo para este tipo de cupones
        Map<String, Object> couponBody = new HashMap<>();
        couponBody.put("name", serviceName + " - " + codeNormalized);
        couponBody.put("type", onvoType);

        if ("percentage".equals(onvoType)) {
            couponBody.put("percentOff", dto.getCouponValue());
        } else {
            couponBody.put("amountOff", dto.getCouponValue());
        }

        // Configuración específica para links de checkout / un solo uso según tu JSON
        // de Onvo
        couponBody.put("scope", "checkout_session");
        couponBody.put("appliesTo", List.of("one_time_links"));

        if (dto.getCouponExpiresAt() != null) {
            couponBody.put("redeemBy", dto.getCouponExpiresAt().toString());
        }
        if (dto.getCouponMaxRedemptions() != null) {
            couponBody.put("maxRedemptions", dto.getCouponMaxRedemptions());
        }

        couponBody.put("code", codeNormalized);

        try {
            ResponseEntity<Map> couponResponse = restTemplate.exchange(
                    onvoApiUrl + "/coupons",
                    HttpMethod.POST,
                    new HttpEntity<>(couponBody, headers),
                    Map.class);

            if (couponResponse.getBody() == null || couponResponse.getBody().get("id") == null) {
                throw new IllegalStateException("Onvo no devolvió el identificador del cupón creado.");
            }
            dto.setCouponId(couponResponse.getBody().get("id").toString());
            dto.setCouponCode(codeNormalized);
            log.info("Cupón creado con éxito en OnvoPay: ID {}", dto.getCouponId());

        } catch (HttpClientErrorException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("Error de Onvo al crear el cupón: {}", errorBody);

            if (errorBody.contains("P2002") || errorBody.contains("Unique constraint")) {
                log.warn("El cupón '{}' ya existe en OnvoPay. El cupón ya está activo en la pasarela.", codeNormalized);
                dto.setCouponCode(codeNormalized);
            } else {
                throw new RuntimeException("Error al registrar el cupón en OnvoPay: " + errorBody);
            }
        }
    }

    private boolean isRecurring(String type) {
        return type != null && !List.of("ONE_TIME", "DAILY").contains(type.toUpperCase());
    }

    private Map<String, Object> recurringInterval(String type) {
        Map<String, Object> intervalMap = new HashMap<>();
        String upperType = type != null ? type.toUpperCase() : "MONTHLY";

        if (upperType.contains("WEEK")) {
            intervalMap.put("interval", "week");
            intervalMap.put("intervalCount", Integer.valueOf(1));
        } else if (upperType.contains("ANNUAL") || upperType.contains("YEAR")) {
            intervalMap.put("interval", "year");
            intervalMap.put("intervalCount", Integer.valueOf(1));
        } else if (upperType.contains("SIX")) {
            intervalMap.put("interval", "month");
            intervalMap.put("intervalCount", Integer.valueOf(6));
        } else {
            // Por defecto mensual
            intervalMap.put("interval", "month");
            intervalMap.put("intervalCount", Integer.valueOf(1));
        }

        return intervalMap;
    }

    private BigDecimal calculateRecurringPrice(BigDecimal price, BigDecimal taxRate, String currency) {
        BigDecimal percentage = cardFeePercentage.movePointLeft(2);
        BigDecimal tax = taxRate.movePointLeft(2);
        BigDecimal fixedFee = cardFixedFeeUsd;
        if ("CRC".equalsIgnoreCase(currency)) {
            ExchangeRate rate = exchangeRateRepository.findTopByOrderByRateDateDesc()
                    .orElseThrow(() -> new IllegalStateException(
                            "No hay un tipo de cambio disponible para calcular el cargo fijo de Onvo."));
            fixedFee = fixedFee.multiply(rate.getUsdSell());
        }
        BigDecimal taxableMultiplier = BigDecimal.ONE.add(tax);
        BigDecimal denominator = BigDecimal.ONE.subtract(percentage.multiply(taxableMultiplier));
        if (denominator.signum() <= 0) {
            throw new IllegalArgumentException("Las tarifas configuradas de pago no permiten calcular el precio.");
        }
        return price.add(fixedFee)
                .multiply(taxableMultiplier)
                .divide(denominator, 2, RoundingMode.HALF_UP);
    }

    private long toMinorUnits(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP)
                .movePointRight(2)
                .longValueExact();
    }

    private record CabysDetails(String code, BigDecimal taxRate) {
    }

    @Transactional
    public ServicePlan updatePlan(UUID id, ServicePlanRequest dto, MultipartFile file) {
        ServicePlan existing = getPlanById(id);
        if (dto.getCabysCode() != null && !dto.getCabysCode().isBlank()) {
            CabysDetails cabys = findCabys(dto.getCabysCode());
            dto.setCabysCode(cabys.code());
            dto.setTaxRate(cabys.taxRate());
        }
        if (dto.getCouponCode() != null && !dto.getCouponCode().isBlank()) {
            validateCoupon(dto, existing.getPrice());
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(onvoApiKey.trim());
            headers.setContentType(MediaType.APPLICATION_JSON);
            createOnvoCouponIfConfigured(dto, headers, existing.getName(), existing.getCurrency());
        }
        return servicePlanImagesService.updatePlanWithImage(id, dto, file);
    }

    @Transactional
    public ServicePlan deleteImage(UUID id) {
        return servicePlanImagesService.deleteImage(id);
    }

    @Transactional
    public void deletePlan(UUID id) {
        servicePlanImagesService.deletePlan(id);
    }

    public List<Map<String, Object>> getPlansFromOnvo() {
        List<Map<String, Object>> plansList = new ArrayList<>();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(onvoApiKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
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

                    Object amount = item.get("unitAmount");
                    double price = amount != null ? Double.parseDouble(amount.toString()) / 100.0 : 0.0;
                    info.put("price", price);

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

    private boolean isArchivedOrInactive(Map<String, Object> resource) {
        if (isFalse(resource.get("isActive")) || isFalse(resource.get("active"))
                || isTrue(resource.get("archived")) || isTrue(resource.get("isArchived"))
                || isTrue(resource.get("isDeleted"))) {
            return true;
        }

        Object status = resource.get("status");
        if (status == null) {
            return false;
        }
        String normalizedStatus = status.toString().trim().toLowerCase(java.util.Locale.ROOT);
        return normalizedStatus.equals("archived")
                || normalizedStatus.equals("inactive")
                || normalizedStatus.equals("deleted");
    }

    private boolean isTrue(Object value) {
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }
        if (value instanceof Number numberValue) {
            return numberValue.intValue() != 0;
        }
        return value != null && "true".equalsIgnoreCase(value.toString().trim());
    }

    private boolean isFalse(Object value) {
        if (value instanceof Boolean booleanValue) {
            return !booleanValue;
        }
        if (value instanceof Number numberValue) {
            return numberValue.intValue() == 0;
        }
        return value != null && "false".equalsIgnoreCase(value.toString().trim());
    }

    public List<Map<String, Object>> getFullEnrichedPlans() {
        List<Map<String, Object>> onvoPlans = getPlansFromOnvo();
        List<ServicePlan> localPlans = servicePlanRepository.findAll();

        for (Map<String, Object> onvoPlan : onvoPlans) {
            String priceId = (String) onvoPlan.get("gatewayPriceId");

            ServicePlan match = localPlans.stream()
                    .filter(p -> p.getGatewayPriceId() != null && p.getGatewayPriceId().equals(priceId))
                    .findFirst()
                    .orElse(null);

            if (match != null) {
                onvoPlan.put("id", match.getId());
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

        return generateCheckoutUrlInternal(gatewayPriceId);
    }

    public Map<String, String> createPaymentIntentOrCheckout(UUID planId) {
        return createCheckoutSessionForPlan(planId);
    }

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