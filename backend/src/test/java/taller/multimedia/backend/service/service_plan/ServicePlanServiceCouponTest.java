package taller.multimedia.backend.service.service_plan;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.http.ResponseEntity.ok;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.web.client.RestTemplate;

import taller.multimedia.backend.dto.service_plan.ServicePlanRequest;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.exchange_rate.ExchangeRateRepository;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;
import taller.multimedia.backend.service.electronic_billing.ElectronicBillingService;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.util.ReflectionTestUtils.setField;

@ExtendWith(MockitoExtension.class)
class ServicePlanServiceCouponTest {

    private static final String API_URL = "https://api.onvopay.com/v1";

    @Mock
    private ServicePlanRepository servicePlanRepository;

    @Mock
    private ServicePlanImageService servicePlanImageService;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ElectronicBillingService electronicBillingService;

    @Mock
    private ExchangeRateRepository exchangeRateRepository;

    @InjectMocks
    private ServicePlanService servicePlanService;

    @BeforeEach
    void setUp() {
        setField(servicePlanService, "onvoApiKey", "test-key");
        setField(servicePlanService, "onvoApiUrl", API_URL);
        setField(servicePlanService, "cardFeePercentage", new BigDecimal("3.9"));
        setField(servicePlanService, "cardFixedFeeUsd", new BigDecimal("0.35"));
    }

    @Test
    void createPlan_attachesAndVerifiesPromotionCodeAfterCreatingCoupon() {
        ServicePlanRequest request = new ServicePlanRequest();
        request.setName("Servicio");
        request.setDescription("Descripción");
        request.setPrice(new BigDecimal("100.00"));
        request.setType("ONE_TIME");
        request.setCurrency("CRC");
        request.setCabysCode("1234567890123");
        request.setSchedule("Horario");
        request.setIncludes("Incluye");
        request.setCouponCode("save10");
        request.setCouponType("percent_off");
        request.setCouponValue(new BigDecimal("10"));

        when(electronicBillingService.searchCabysCatalog(request.getCabysCode())).thenReturn(Map.of(
                "items", List.of(Map.of("codigo", request.getCabysCode(), "impuesto", 4))));
        when(restTemplate.exchange(
                eq(API_URL + "/products"), eq(POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(ok(Map.of("id", "product_123")));
        when(restTemplate.exchange(
                eq(API_URL + "/prices"), eq(POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(ok(Map.of("id", "price_123", "unitAmount", 10000)));
        when(restTemplate.exchange(
                eq(API_URL + "/coupons"), eq(POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(ok(Map.of("id", "coupon_123")));
        when(restTemplate.exchange(
                eq(API_URL + "/coupons/coupon_123"), eq(POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(ok(Map.of("id", "coupon_123")));
        when(restTemplate.exchange(
                eq(API_URL + "/coupons/coupon_123"), eq(GET), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(ok(Map.of(
                        "id", "coupon_123",
                        "promotionCodes", List.of(Map.of("code", "SAVE10", "isActive", true)))));
        when(servicePlanImageService.createPlanWithImage(request, null)).thenReturn(new ServicePlan());

        servicePlanService.createPlan(request, null);

        assertEquals("coupon_123", request.getCouponId());
        assertEquals("SAVE10", request.getCouponCode());
        verify(restTemplate).exchange(
                eq(API_URL + "/coupons/coupon_123"), eq(POST), any(HttpEntity.class), eq(Map.class));
        verifyNoInteractions(servicePlanRepository);
    }
}
