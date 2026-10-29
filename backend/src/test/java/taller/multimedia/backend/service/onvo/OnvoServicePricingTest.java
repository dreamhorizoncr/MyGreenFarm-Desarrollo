package taller.multimedia.backend.service.onvo;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import taller.multimedia.backend.dto.onvo.PaymentQuote;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.exchange_rate.ExchangeRateRepository;
import taller.multimedia.backend.repository.onvo.PaymentIntentPricingRepository;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;
import taller.multimedia.backend.service.EmailService;
import taller.multimedia.backend.service.electronic_billing.ElectronicBillingService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.ResponseEntity.ok;

@ExtendWith(MockitoExtension.class)
class OnvoServicePricingTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ElectronicBillingService electronicBillingService;

    @Mock
    private EmailService emailService;

    @Mock
    private ServicePlanRepository servicePlanRepository;

    @Mock
    private ExchangeRateRepository exchangeRateRepository;

    @Mock
    private PaymentIntentPricingRepository paymentIntentPricingRepository;

    @InjectMocks
    private OnvoService onvoService;

    private ServicePlan plan;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(onvoService, "onvoApiUrl", "https://api.onvopay.com/v1");
        ReflectionTestUtils.setField(onvoService, "onvoApiKey", "test-key");
        ReflectionTestUtils.setField(onvoService, "cardFeePercentage", new BigDecimal("3.9"));
        ReflectionTestUtils.setField(onvoService, "cardFixedFeeUsd", new BigDecimal("0.35"));
        ReflectionTestUtils.setField(onvoService, "sinpeFeePercentage", new BigDecimal("1.5"));

        plan = new ServicePlan();
        plan.setId(UUID.randomUUID());
        plan.setActive(true);
        plan.setPrice(new BigDecimal("100.00"));
        plan.setCurrency("USD");
        plan.setType("MONTHLY");
        plan.setGatewayPriceId("price_123");
        plan.setGatewayPriceAmount(new BigDecimal("108.77"));
        plan.setCabysCode("1234567890123");
        plan.setTaxRate(new BigDecimal("4"));

        when(servicePlanRepository.findById(plan.getId())).thenReturn(Optional.of(plan));
        when(electronicBillingService.searchCabysCatalog(plan.getCabysCode())).thenReturn(Map.of(
                "items", List.of(Map.of(
                        "codigo", plan.getCabysCode(),
                        "categorias", List.of("Educación", "Tragar"),
                        "impuesto", 4))));
    }

    @Test
    void quoteServicePlan_appliesCardPercentageFixedUsdFeeAndCabysVat() {
        PaymentQuote quote = onvoService.quoteServicePlan(plan.getId(), null, "card", plan.getCabysCode());

        assertEquals(new BigDecimal("108.77"), quote.totalAmount());
        assertEquals(new BigDecimal("4.00"), quote.serviceTaxAmount());
        assertEquals(new BigDecimal("4.59"), quote.processingFeeAmount());
        assertEquals(new BigDecimal("0.18"), quote.processingFeeTaxAmount());
        assertEquals(plan.getCabysCode(), quote.cabysCode());
        assertEquals(new BigDecimal("4"), quote.taxRate());
        assertEquals("Educación / Tragar", quote.cabysDescription());
    }

    @Test
    void quoteServicePlan_usesSinpeRateWithoutFixedFee() {
        PaymentQuote quote = onvoService.quoteServicePlan(plan.getId(), null, "sinpe", plan.getCabysCode());

        assertEquals(new BigDecimal("105.64"), quote.totalAmount());
        assertEquals(BigDecimal.ZERO.setScale(2), quote.discountAmount());
        assertEquals(new BigDecimal("4.00"), quote.serviceTaxAmount());
        assertEquals(new BigDecimal("1.58"), quote.processingFeeAmount());
        assertEquals(new BigDecimal("0.06"), quote.processingFeeTaxAmount());
    }

    @Test
    void quoteServicePlan_appliesCouponBeforeTaxAndFees() {
        plan.setCouponId("coupon_123");
        plan.setCouponCode("SAVE10");
        plan.setCouponType("percent_off");
        plan.setCouponValue(new BigDecimal("10"));
        when(restTemplate.exchange(
                eq("https://api.onvopay.com/v1/coupons/coupon_123"),
                eq(GET),
                any(),
                eq(Map.class))).thenReturn(ok(Map.of(
                        "isActive", true,
                        "promotionCodes", List.of(Map.of("code", "SAVE10", "isActive", true)))));

        PaymentQuote quote = onvoService.quoteServicePlan(plan.getId(), "save10", "card", plan.getCabysCode());

        assertEquals(new BigDecimal("10.00"), quote.discountAmount());
        assertEquals(new BigDecimal("90.00"), quote.baseAmount().subtract(quote.discountAmount()));
        assertEquals(new BigDecimal("3.60"), quote.serviceTaxAmount());
    }
}
