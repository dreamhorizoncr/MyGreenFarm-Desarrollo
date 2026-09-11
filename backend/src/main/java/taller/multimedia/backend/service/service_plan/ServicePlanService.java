package taller.multimedia.backend.service.service_plan;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PriceCollection;
import com.stripe.param.PriceListParams;

import taller.multimedia.backend.dto.service_plan.ServicePlanRequest;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;

import com.stripe.model.Price;
import com.stripe.model.Product;
import com.stripe.model.ProductCollection;
import com.stripe.param.ProductListParams;

import jakarta.annotation.PostConstruct;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ServicePlanService {

    private final ServicePlanRepository servicePlanRepository;
    private final ServicePlanImageService servicePlanImagesService;

    @Value("${stripe.api.secret.key}")
    private String stripeApiKey;

    @PostConstruct
    public void initStripe() {
        Stripe.apiKey = stripeApiKey;
    }

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

    // 4. TRAER DESDE STRIPE: Este método se queda igual, alimenta el dropdown de tu
    // frontend
    public List<Map<String, Object>> getPlansFromStripe() throws StripeException {
        List<Map<String, Object>> plansList = new ArrayList<>();

        ProductListParams productParams = ProductListParams.builder()
                .setActive(true)
                .build();
        ProductCollection products = Product.list(productParams);

        for (Product product : products.getData()) {
            PriceListParams priceParams = PriceListParams.builder()
                    .setProduct(product.getId())
                    .setActive(true)
                    .build();
            PriceCollection prices = Price.list(priceParams);

            for (Price price : prices.getData()) {
                Map<String, Object> planInfo = new HashMap<>();
                planInfo.put("id", product.getId());
                planInfo.put("priceId", price.getId()); // <- Este es el que seleccionas en el dropdown
                planInfo.put("name", product.getName());
                planInfo.put("description", product.getDescription());
                planInfo.put("price", price.getUnitAmount() != null ? price.getUnitAmount() / 100.0 : 0.0);
                planInfo.put("currency", price.getCurrency());
                planInfo.put("interval",
                        price.getRecurring() != null ? price.getRecurring().getInterval() : "one_time");

                plansList.add(planInfo);
            }
        }

        return plansList;
    }

    // 5. FUSIÓN FINAL (Opcional pero recomendado para el Frontend):
    // Une lo que viene de Stripe con la imagen y los horarios que guardaste en
    // Supabase
    public List<Map<String, Object>> getFullEnrichedPlans() throws StripeException {
        List<Map<String, Object>> stripePlans = getPlansFromStripe();
        List<ServicePlan> Plans = servicePlanRepository.findAll();

        for (Map<String, Object> stripePlan : stripePlans) {
            String priceId = (String) stripePlan.get("priceId");

            // Buscar si este precio de Stripe ya tiene configuración en Supabase
            ServicePlan match = Plans.stream()
                    .filter(p -> p.getStripePriceId() != null && p.getStripePriceId().equals(priceId))
                    .findFirst()
                    .orElse(null);

            if (match != null) {
                stripePlan.put("Id", match.getId());
                stripePlan.put("imageUrl", match.getImageUrl());
                stripePlan.put("schedule", match.getSchedule());
                stripePlan.put("includes", match.getIncludes());
            } else {
                stripePlan.put("imageUrl", null);
                stripePlan.put("schedule", "No asignado");
                stripePlan.put("includes", "");
            }
        }

        return stripePlans;
    }
}
