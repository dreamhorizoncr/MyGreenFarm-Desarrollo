package taller.multimedia.backend.controller.service_plan;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.http.MediaType;
import com.stripe.exception.StripeException;

import jakarta.validation.Valid;
import taller.multimedia.backend.dto.service_plan.ServicePlanRequest;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.service.service_plan.ServicePlanImageService;
import taller.multimedia.backend.service.service_plan.ServicePlanService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/service-plans")
@RequiredArgsConstructor
public class ServicePlanController {

    private final ServicePlanService servicePlanService;

    private final ServicePlanImageService servicePlanImageService;

    // 1. Obtiene los planes desde Stripe y los enriquece con la imagen del bucket y
    // horarios de Supabase
    @GetMapping("/stripe-plans")
    public ResponseEntity<?> getFullEnrichedPlans() {
        try {
            List<Map<String, Object>> enrichedPlans = servicePlanService.getFullEnrichedPlans();
            return ResponseEntity.ok(enrichedPlans);
        } catch (StripeException e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // 2. Obtiene solo la lista cruda de productos y precios directamente desde
    // Stripe (ideal para llenar el dropdown)
    @GetMapping("/stripe-raw")
    public ResponseEntity<?> getStripePlans() {
        try {
            List<Map<String, Object>> stripePlans = servicePlanService.getPlansFromStripe();
            return ResponseEntity.ok(stripePlans);
        } catch (StripeException e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<ServicePlan>> getAllPlans(@RequestParam(required = false) Boolean activeOnly) {
        List<ServicePlan> plans = (activeOnly != null && activeOnly)
                ? servicePlanService.getActivePlans()
                : servicePlanService.getAllPlans();
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServicePlan> getPlanById(@PathVariable UUID id) {
        return ResponseEntity.ok(servicePlanService.getPlanById(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ServicePlan> createPlan(
            @ModelAttribute ServicePlanRequest dto,
            @RequestParam("file") MultipartFile file) {

        ServicePlan created = servicePlanService.createPlan(dto, file);
        return ResponseEntity.ok(created);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ServicePlan> updatePlan(
            @PathVariable UUID id,
            @ModelAttribute ServicePlanRequest dto,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        ServicePlan updated = servicePlanService.updatePlan(id, dto, file);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePlan(@PathVariable UUID id) {
        servicePlanService.deletePlan(id);
        return ResponseEntity.ok(Map.of("message", "Configuración de plan eliminada exitosamente"));
    }
}