package taller.multimedia.backend.service.onvo;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.onvo.PaymentQuote;
import taller.multimedia.backend.model.exchange_rate.ExchangeRate;
import taller.multimedia.backend.model.onvo.PaymentIntentPricing;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.exchange_rate.ExchangeRateRepository;
import taller.multimedia.backend.repository.onvo.PaymentIntentPricingRepository;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;
import taller.multimedia.backend.service.EmailService;
import taller.multimedia.backend.service.electronic_billing.ElectronicBillingService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    private final ServicePlanRepository servicePlanRepository;

    private final ExchangeRateRepository exchangeRateRepository;

    private final PaymentIntentPricingRepository paymentIntentPricingRepository;

    @Value("${onvo.fees.card.percentage:3.9}")
    private BigDecimal cardFeePercentage;

    @Value("${onvo.fees.card.fixed-usd:0.35}")
    private BigDecimal cardFixedFeeUsd;

    @Value("${onvo.fees.sinpe-mobile.percentage:1.5}")
    private BigDecimal sinpeFeePercentage;

    private static final Logger log = LoggerFactory.getLogger(OnvoService.class);

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

    public PaymentQuote quoteServicePlan(
            UUID servicePlanId,
            String couponCode,
            String paymentMethod,
            String cabysCode) {
        ServicePlan plan = getActivePlan(servicePlanId);
        return calculateQuote(plan, couponCode, paymentMethod, cabysCode);
    }

    @Transactional
    public Map<String, Object> createPaymentIntentForPlan(
            UUID servicePlanId,
            String customerEmail,
            String description,
            String couponCode,
            String cabysCode,
            String paymentMethod,
            String language,
            Boolean saveSubscription) {
                
        ServicePlan plan = getActivePlan(servicePlanId);
        String normalizedMethod = normalizePaymentMethod(paymentMethod);
        if ("sinpe".equals(normalizedMethod) && "USD".equalsIgnoreCase(plan.getCurrency())) {
            throw new IllegalArgumentException("SINPE Móvil no está disponible para pagos en dólares.");
        }
        if (Boolean.TRUE.equals(saveSubscription) && ("sinpe".equals(normalizedMethod) || !isRecurring(plan))) {
            throw new IllegalArgumentException("La renovación automática requiere tarjeta y un servicio recurrente.");
        }

        PaymentQuote quote = calculateQuote(plan, couponCode, normalizedMethod, cabysCode);
        Map<String, Object> body = new HashMap<>();
        body.put("amount", toMinorUnits(quote.totalAmount()));
        body.put("currency", quote.currency());
        body.put("description", description);

        ResponseEntity<Map> response = restTemplate.exchange(
                onvoApiUrl + "/payment-intents",
                HttpMethod.POST,
                new HttpEntity<>(body, buildHeaders()),
                Map.class);
        if (response.getBody() == null || response.getBody().get("id") == null) {
            throw new IllegalStateException("Onvo no devolvió el identificador de la intención de pago.");
        }

        PaymentIntentPricing pricing = new PaymentIntentPricing();
        pricing.setPaymentIntentId(response.getBody().get("id").toString());
        pricing.setServicePlanId(plan.getId());
        pricing.setServiceDescription(description);
        pricing.setBaseAmount(quote.baseAmount().subtract(quote.discountAmount()));
        pricing.setServiceTaxAmount(quote.serviceTaxAmount());
        pricing.setProcessingFeeAmount(quote.processingFeeAmount());
        pricing.setProcessingFeeTaxAmount(quote.processingFeeTaxAmount());
        pricing.setTotalAmount(quote.totalAmount());
        pricing.setCurrency(quote.currency());
        pricing.setPaymentMethod(normalizedMethod);
        pricing.setServiceCabysCode(quote.cabysCode());
        pricing.setServiceTaxRate(quote.taxRate());
        pricing.setFeeCabysCode(quote.cabysCode());
        pricing.setFeeTaxRate(quote.taxRate());
        pricing.setLanguage(language == null ? "es" : language);
        pricing.setCouponCode(normalizeCouponCode(couponCode));
        pricing.setSaveSubscription(saveSubscription);
        paymentIntentPricingRepository.save(pricing);
        return response.getBody();
    }

    private PaymentQuote calculateQuote(
            ServicePlan plan,
            String couponCode,
            String paymentMethod,
            String requestedCabysCode) {
        String method = normalizePaymentMethod(paymentMethod);
        CabysDetails cabys = findCabys(plan, requestedCabysCode);
        BigDecimal discountedBase = applyCoupon(plan, couponCode);
        BigDecimal taxRate = cabys.taxRate().movePointLeft(2);
        BigDecimal feeRate = ("sinpe".equals(method) ? sinpeFeePercentage : cardFeePercentage)
                .movePointLeft(2);
        BigDecimal fixedFee = BigDecimal.ZERO;
        BigDecimal exchangeRate = null;
        if ("card".equals(method)) {
            fixedFee = cardFixedFeeUsd;
            if ("CRC".equalsIgnoreCase(plan.getCurrency())) {
                exchangeRate = getLatestBacUsdSellRate();
                fixedFee = fixedFee.multiply(exchangeRate);
            }
        }

        BigDecimal taxableMultiplier = BigDecimal.ONE.add(taxRate);
        BigDecimal denominator = BigDecimal.ONE.subtract(feeRate.multiply(taxableMultiplier));
        if (denominator.signum() <= 0) {
            throw new IllegalStateException("Las tarifas de pago configuradas no permiten calcular el total.");
        }
        BigDecimal grossTotal;
        if ("card".equals(method) && isRecurring(plan) && normalizeCouponCode(couponCode) == null) {
            grossTotal = getOnvoPriceAmount(plan);
        } else {
            grossTotal = discountedBase.add(fixedFee)
                    .multiply(taxableMultiplier)
                    .divide(denominator, 8, RoundingMode.HALF_UP);
        }
        BigDecimal taxableAmount = grossTotal.divide(taxableMultiplier, 2, RoundingMode.HALF_UP);
        BigDecimal total = taxableAmount.multiply(taxableMultiplier).setScale(2, RoundingMode.HALF_UP);
        BigDecimal feeAmount = taxableAmount.subtract(discountedBase).setScale(2, RoundingMode.HALF_UP);
        BigDecimal serviceTax = discountedBase.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalTax = total.subtract(taxableAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal feeTax = totalTax.subtract(serviceTax).setScale(2, RoundingMode.HALF_UP);

        return new PaymentQuote(
                plan.getId(),
                plan.getPrice().setScale(2, RoundingMode.HALF_UP),
                plan.getPrice().subtract(discountedBase).setScale(2, RoundingMode.HALF_UP),
                serviceTax,
                feeAmount,
                feeTax,
                total,
                plan.getCurrency().toUpperCase(Locale.ROOT),
                method,
                exchangeRate,
                cabys.code(),
                cabys.taxRate(),
                cabys.description());
    }

    private BigDecimal getOnvoPriceAmount(ServicePlan plan) {
        if (plan.getGatewayPriceAmount() != null) {
            return plan.getGatewayPriceAmount().setScale(2, RoundingMode.HALF_UP);
        }

        Map<String, Object> priceDetails = getPriceDetails(plan.getGatewayPriceId());
        Object rawAmount = priceDetails.get("unitAmount");
        if (!(rawAmount instanceof Number amount)) {
            throw new IllegalStateException("El precio de Onvo no contiene un monto válido.");
        }
        return BigDecimal.valueOf(amount.longValue(), 2);
    }

    private CabysDetails findCabys(ServicePlan plan, String requestedCabysCode) {
        String code = requestedCabysCode == null || requestedCabysCode.isBlank()
                ? plan.getCabysCode()
                : requestedCabysCode.trim();
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Selecciona el código CABYS correspondiente al servicio.");
        }
        Map<String, Object> response = electronicBillingService.searchCabysCatalog(code);
        Object rawItems = response == null ? null : response.get("items");
        if (!(rawItems instanceof List<?>) && response != null) {
            rawItems = response.get("data");
        }
        List<?> items = rawItems instanceof List<?> resultItems
                ? resultItems
                : response != null && response.containsKey("codigo") ? List.of(response) : List.of();
        if (!items.isEmpty()) {
            for (Object rawItem : items) {
                if (rawItem instanceof Map<?, ?> item && code.equals(String.valueOf(item.get("codigo")))) {
                    Object rawRate = item.get("impuesto");
                    if (rawRate == null) {
                        throw new IllegalStateException("El código CABYS no incluye su porcentaje de IVA.");
                    }
                    BigDecimal rate = new BigDecimal(rawRate.toString());
                    if (!List.of(0, 1, 2, 4, 8, 13).contains(rate.intValue())
                            || rate.compareTo(BigDecimal.valueOf(rate.intValue())) != 0) {
                        throw new IllegalStateException("El porcentaje de IVA del CABYS no está soportado.");
                    }
                    return new CabysDetails(code, rate, cabysDescription(item));
                }
            }
        }
        throw new IllegalArgumentException("El código CABYS seleccionado no existe en el catálogo.");
    }

    private String cabysDescription(Map<?, ?> item) {
        Object rawCategories = item.get("categorias");
        if (rawCategories == null) rawCategories = item.get("categories");
        if (rawCategories instanceof List<?> categories) {
            return categories.stream().map(String::valueOf).filter(value -> !value.isBlank())
                    .reduce((first, next) -> first + " / " + next).orElse("");
        }
        return rawCategories == null ? "" : rawCategories.toString();
    }

    private BigDecimal getBacRateForCurrency(String currency) {
        return "USD".equalsIgnoreCase(currency) ? getLatestBacUsdSellRate() : null;
    }

    private BigDecimal getLatestBacUsdSellRate() {
        ExchangeRate latestRate = exchangeRateRepository.findTopByOrderByRateDateDesc()
                .orElseThrow(() -> new IllegalStateException("No hay un tipo de cambio BAC disponible."));
        BigDecimal usdSell = latestRate.getUsdSell();
        if (usdSell == null || usdSell.signum() <= 0) {
            throw new IllegalStateException("El tipo de cambio de venta del BAC no es válido.");
        }
        return usdSell;
    }

    private BigDecimal applyCoupon(ServicePlan plan, String couponCode) {
        String normalizedCode = normalizeCouponCode(couponCode);
        if (normalizedCode == null) {
            return plan.getPrice().setScale(2, RoundingMode.HALF_UP);
        }
        if (plan.getCouponCode() == null || plan.getCouponId() == null
                || !normalizedCode.equals(plan.getCouponCode().toUpperCase(Locale.ROOT))) {
            throw new IllegalArgumentException("El código de descuento no es válido para este servicio.");
        }
        if (plan.getCouponExpiresAt() != null && plan.getCouponExpiresAt().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("El código de descuento ha vencido.");
        }
        if (plan.getCouponMaxRedemptions() != null
                && plan.getCouponRedemptions() >= plan.getCouponMaxRedemptions()) {
            throw new IllegalArgumentException("El código de descuento alcanzó su máximo de usos.");
        }

        Map<String, Object> coupon = getCouponDetails(plan.getCouponId());
        log.info("JSON completo devuelto por Onvo para el cupón {}: {}", plan.getCouponId(), coupon);

        if (Boolean.FALSE.equals(coupon.get("isActive"))) {
            throw new IllegalArgumentException("El código de descuento ya no está activo.");
        }

        Object rawPromotions = coupon.get("promotionCodes");
        log.info("promotionCodes recibido de Onvo: type={}, value={}", 
                rawPromotions != null ? rawPromotions.getClass().getName() : "null", rawPromotions);

        boolean codeFound = false;
        if (rawPromotions instanceof List<?> promotions) {
            for (Object promotion : promotions) {
                if (promotion instanceof Map<?, ?> promotionMap) {
                    String promoCodeOnvo = String.valueOf(promotionMap.get("code"));
                    log.info("Evaluando código de Onvo: '{}' vs buscado: '{}'", promoCodeOnvo, normalizedCode);
                    
                    if (normalizedCode.equalsIgnoreCase(promoCodeOnvo)) {
                        if (Boolean.FALSE.equals(promotionMap.get("isActive"))) {
                            throw new IllegalArgumentException("El código de descuento ya no está activo.");
                        }
                        codeFound = true;
                        break;
                    }
                }
            }
        }
        
        if (!codeFound) {
            log.error("El cupón ID {} en Onvo no contiene el código '{}' dentro de promotionCodes.", plan.getCouponId(), normalizedCode);
            throw new IllegalArgumentException("Onvo no reconoce el código de descuento.");
        }

        BigDecimal discount = plan.getCouponValue();
        if ("percent_off".equals(plan.getCouponType())) {
            discount = plan.getPrice().multiply(discount.movePointLeft(2));
        }
        return plan.getPrice().subtract(discount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private Map<String, Object> getCouponDetails(String couponId) {
        ResponseEntity<Map> response = restTemplate.exchange(
                onvoApiUrl + "/coupons/" + couponId,
                HttpMethod.GET,
                new HttpEntity<>(buildHeaders()),
                Map.class);
        if (response.getBody() == null) {
            throw new IllegalStateException("Onvo no devolvió los datos del cupón.");
        }
        return response.getBody();
    }

    private ServicePlan getActivePlan(UUID servicePlanId) {
        ServicePlan plan = servicePlanRepository.findById(servicePlanId)
                .orElseThrow(() -> new IllegalArgumentException("El servicio solicitado no existe."));
        if (!plan.isActive()) {
            throw new IllegalArgumentException("El servicio solicitado no está disponible.");
        }
        return plan;
    }

    private String normalizePaymentMethod(String paymentMethod) {
        if ("sinpe".equalsIgnoreCase(paymentMethod)) {
            return "sinpe";
        }
        if ("card".equalsIgnoreCase(paymentMethod)) {
            return "card";
        }
        throw new IllegalArgumentException("Selecciona tarjeta o SINPE Móvil como método de pago.");
    }

    private String normalizeCouponCode(String couponCode) {
        return couponCode == null || couponCode.isBlank()
                ? null
                : couponCode.trim().toUpperCase(Locale.ROOT);
    }

    private boolean isRecurring(ServicePlan plan) {
        return plan.getType() != null
                && !List.of("ONE_TIME", "DAILY").contains(plan.getType().toUpperCase(Locale.ROOT));
    }

    private int toMinorUnits(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP).movePointRight(2).intValueExact();
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

    @Transactional
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
            String clientIdentification) {
        PaymentIntentPricing pricing = paymentIntentPricingRepository.findByPaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new IllegalArgumentException("La intención de pago no tiene un precio validado."));
        ServicePlan plan = getActivePlan(pricing.getServicePlanId());

        String paymentMethodUrl = onvoApiUrl + "/payment-methods";
        HttpHeaders headers = buildHeaders();
        Map<String, Object> cardData = Map.of(
                "number", cardNumber.replaceAll("\\s+", ""),
                "expMonth", expMonth,
                "expYear", expYear,
                "cvv", cvc,
                "holderName", cardHolder);
        Map<String, Object> paymentMethodBody = Map.of("type", "card", "card", cardData);

        try {
            ResponseEntity<Map> pmResponse = restTemplate.exchange(
                    paymentMethodUrl, HttpMethod.POST, new HttpEntity<>(paymentMethodBody, headers), Map.class);
            if (pmResponse.getBody() == null || !pmResponse.getBody().containsKey("id")) {
                throw new IllegalStateException("No se pudo generar el método de pago en Onvo.");
            }
            String paymentMethodId = pmResponse.getBody().get("id").toString();

            String confirmUrl = onvoApiUrl + "/payment-intents/" + paymentIntentId + "/confirm";
            ResponseEntity<Map> confirmResponse = restTemplate.exchange(
                    confirmUrl,
                    HttpMethod.POST,
                    new HttpEntity<>(Map.of("paymentMethodId", paymentMethodId), headers),
                    Map.class);
            Map<String, Object> responseBody = confirmResponse.getBody();
            String paymentStatus = responseBody == null ? null : (String) responseBody.get("status");
            if (!"succeeded".equalsIgnoreCase(paymentStatus == null ? "" : paymentStatus.trim())) {
                log.info("El pago no fue exitoso. Status: {}", paymentStatus);
                return responseBody == null ? Map.of() : responseBody;
            }

            Map<String, Object> result = new HashMap<>(responseBody);
            try {
                Map<String, Object> invoiceResponse = electronicBillingService.emitInvoiceForSuccessfulPayment(
                        clientName,
                        clientEmail,
                        identificationType,
                        clientIdentification,
                        pricing.getBaseAmount().add(pricing.getProcessingFeeAmount()),
                        pricing.getServiceDescription(),
                        pricing.getServiceCabysCode(),
                        pricing.getServiceTaxRate(),
                        BigDecimal.ZERO,
                        null,
                        BigDecimal.ZERO,
                        pricing.getCurrency(),
                        getBacRateForCurrency(pricing.getCurrency()));
                emailService.sendInvoiceWithPdf(
                        clientEmail,
                        clientName,
                        invoiceResponse,
                        Locale.forLanguageTag(pricing.getLanguage() == null ? "es" : pricing.getLanguage()));
            } catch (Exception exception) {
                log.error("El pago se completó, pero falló la factura o el correo para {}: {}",
                        clientEmail, exception.getMessage());
                result.put("invoiceError", "El pago fue aprobado, pero no se pudo completar la facturación.");
            }

            recordCouponRedemption(plan, pricing);
            if (pricing.getSaveSubscription()) {
                try {
                    Map<String, Object> subscription = createCustomerAndSubscription(
                            clientEmail, clientName, paymentMethodId, plan, pricing);
                    result.put("subscriptionId", subscription.get("id"));
                } catch (RuntimeException exception) {
                    log.error("El pago se completó, pero falló la renovación para {}: {}",
                            clientEmail, exception.getMessage());
                    result.put("subscriptionError",
                            "El pago se completó, pero no se pudo activar la renovación automática. Contacta al negocio.");
                }
            }
            return result;
        } catch (HttpStatusCodeException exception) {
            throw new RuntimeException("Error al procesar el pago con Onvo: " + exception.getResponseBodyAsString());
        }
    }

    private Map<String, Object> createCustomerAndSubscription(
            String customerEmail,
            String clientName,
            String paymentMethodId,
            ServicePlan plan,
            PaymentIntentPricing pricing) {
        Map<String, Object> customerBody = Map.of(
                "email", customerEmail,
                "name", clientName,
                "paymentMethodId", paymentMethodId);
        ResponseEntity<Map> customerResponse = restTemplate.exchange(
                onvoApiUrl + "/customers",
                HttpMethod.POST,
                new HttpEntity<>(customerBody, buildHeaders()),
                Map.class);
        if (customerResponse.getBody() == null || customerResponse.getBody().get("id") == null) {
            throw new IllegalStateException("Onvo no devolvió el identificador del cliente.");
        }

        Map<String, Object> subscriptionBody = new HashMap<>();
        subscriptionBody.put("customerId", customerResponse.getBody().get("id"));
        subscriptionBody.put("paymentMethodId", paymentMethodId);
        subscriptionBody.put("items", List.of(Map.of(
                "priceId", recurringPriceId(plan, pricing),
                "quantity", 1)));
        subscriptionBody.put("startDate", nextRenewalDate(plan.getType()).toString());
        ResponseEntity<Map> subscriptionResponse = restTemplate.exchange(
                onvoApiUrl + "/subscriptions",
                HttpMethod.POST,
                new HttpEntity<>(subscriptionBody, buildHeaders()),
                Map.class);
        if (subscriptionResponse.getBody() == null || subscriptionResponse.getBody().get("id") == null) {
            throw new IllegalStateException("Onvo no devolvió el identificador de la suscripción.");
        }
        return subscriptionResponse.getBody();
    }

    private String recurringPriceId(ServicePlan plan, PaymentIntentPricing pricing) {
        if (plan.getTaxRate() != null
                && plan.getTaxRate().compareTo(pricing.getServiceTaxRate()) == 0) {
            return plan.getGatewayPriceId();
        }

        Map<String, Object> originalPrice = getPriceDetails(plan.getGatewayPriceId());
        Object productId = originalPrice.get("productId");
        if (productId == null) {
            throw new IllegalStateException("No se pudo identificar el producto de Onvo para la renovación.");
        }
        Object recurring = originalPrice.get("recurring");
        Map<String, Object> body = new HashMap<>();
        body.put("productId", productId);
        body.put("unitAmount", toMinorUnits(calculateRecurringPrice(
                plan.getPrice(), pricing.getServiceTaxRate(), plan.getCurrency())));
        body.put("currency", plan.getCurrency().toUpperCase(Locale.ROOT));
        body.put("type", "recurring");
        body.put("recurring", recurring instanceof Map<?, ?> recurringMap
                ? recurringMap
                : recurringInterval(plan.getType()));
        ResponseEntity<Map> response = restTemplate.exchange(
                onvoApiUrl + "/prices",
                HttpMethod.POST,
                new HttpEntity<>(body, buildHeaders()),
                Map.class);
        if (response.getBody() == null || response.getBody().get("id") == null) {
            throw new IllegalStateException("Onvo no devolvió el precio recurrente con el CABYS seleccionado.");
        }
        return response.getBody().get("id").toString();
    }

    private BigDecimal calculateRecurringPrice(BigDecimal price, BigDecimal taxRate, String currency) {
        BigDecimal tax = taxRate.movePointLeft(2);
        BigDecimal feeRate = cardFeePercentage.movePointLeft(2);
        BigDecimal fixedFee = cardFixedFeeUsd;
        if ("CRC".equalsIgnoreCase(currency)) {
            fixedFee = fixedFee.multiply(getLatestBacUsdSellRate());
        }
        BigDecimal taxableMultiplier = BigDecimal.ONE.add(tax);
        BigDecimal denominator = BigDecimal.ONE.subtract(feeRate.multiply(taxableMultiplier));
        if (denominator.signum() <= 0) {
            throw new IllegalStateException("Las tarifas de pago configuradas no permiten calcular la renovación.");
        }
        return price.add(fixedFee)
                .multiply(taxableMultiplier)
                .divide(denominator, 2, RoundingMode.HALF_UP);
    }

    private Map<String, String> recurringInterval(String type) {
        return switch (type.toUpperCase(Locale.ROOT)) {
            case "WEEKLY", "CUSTOM_WEEKLY" -> Map.of("interval", "week", "intervalCount", "1");
            case "TWO_WEEKS" -> Map.of("interval", "week", "intervalCount", "2");
            case "SIX_MONTHS" -> Map.of("interval", "month", "intervalCount", "6");
            case "ANNUAL", "ANNUALLY" -> Map.of("interval", "year", "intervalCount", "1");
            default -> Map.of("interval", "month", "intervalCount", "1");
        };
    }

    private LocalDate nextRenewalDate(String type) {
        return switch (type.toUpperCase(Locale.ROOT)) {
            case "WEEKLY", "CUSTOM_WEEKLY" -> LocalDate.now().plusWeeks(1);
            case "TWO_WEEKS" -> LocalDate.now().plusWeeks(2);
            case "SIX_MONTHS" -> LocalDate.now().plusMonths(6);
            case "ANNUAL", "ANNUALLY" -> LocalDate.now().plusYears(1);
            default -> LocalDate.now().plusMonths(1);
        };
    }

    private void recordCouponRedemption(ServicePlan plan, PaymentIntentPricing pricing) {
        if (pricing.getCouponCode() != null
                && pricing.getCouponCode().equalsIgnoreCase(plan.getCouponCode())) {
            plan.setCouponRedemptions(plan.getCouponRedemptions() + 1);
            servicePlanRepository.save(plan);
        }
    }

    private record CabysDetails(String code, BigDecimal taxRate, String description) {}

    @Transactional
    public Map<String, Object> confirmPaymentIntentWithSinpe(
            String paymentIntentId,
            String phoneNumber,
            String sinpeReference,
            String clientName,
            String clientEmail,
            String identificationType,
            String clientIdentification) {
        PaymentIntentPricing pricing = paymentIntentPricingRepository.findByPaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new IllegalArgumentException("La intención de pago no tiene un precio validado."));
        if (!"sinpe".equals(pricing.getPaymentMethod())) {
            throw new IllegalArgumentException("La intención de pago no fue creada para SINPE Móvil.");
        }
        ServicePlan plan = getActivePlan(pricing.getServicePlanId());
        if ("USD".equalsIgnoreCase(pricing.getCurrency())) {
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
                Map<String, Object> result = new HashMap<>(responseBody);
                try {
                    Map<String, Object> invoiceResponse = electronicBillingService.emitInvoiceForSuccessfulPayment(
                            clientName,
                            clientEmail,
                            identificationType,
                            clientIdentification,
                            pricing.getBaseAmount().add(pricing.getProcessingFeeAmount()),
                            pricing.getServiceDescription(),
                            pricing.getServiceCabysCode(),
                            pricing.getServiceTaxRate(),
                            BigDecimal.ZERO,
                            null,
                            BigDecimal.ZERO,
                            pricing.getCurrency(),
                            getBacRateForCurrency(pricing.getCurrency()));

                    emailService.sendInvoiceWithPdf(clientEmail, clientName, invoiceResponse,
                            Locale.forLanguageTag(pricing.getLanguage() == null ? "es" : pricing.getLanguage()));
                    log.info("Proceso de factura e correo iniciado en segundo plano para: {}", clientEmail);
                } catch (Exception exception) {
                    log.error("El pago SINPE se completó, pero falló la factura o el correo para {}: {}",
                            clientEmail, exception.getMessage());
                    result.put("invoiceError", "El pago fue aprobado, pero no se pudo completar la facturación.");
                }
                recordCouponRedemption(plan, pricing);
                return result;
            } else {
                log.info("El pago SINPE no fue exitoso. Status: {}", paymentStatus);
            }

            return confirmResponse.getBody() == null ? Map.of() : confirmResponse.getBody();

        } catch (HttpStatusCodeException exception) {
            throw new RuntimeException("Error al procesar el pago SINPE con Onvo: "
                    + exception.getResponseBodyAsString());
        }
    }

}