package taller.multimedia.backend.controller.service_plan;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import taller.multimedia.backend.dto.service_plan.ServicePlanRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.service.service_plan.ServicePlanService;
import taller.multimedia.backend.service.spelling.SpellingCorrectionAsyncService;
import tools.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/service-plans")
@RequiredArgsConstructor
public class ServicePlanController {

    private final ServicePlanService servicePlanService;
    private final SpellingCorrectionAsyncService spellingCorrectionAsyncService;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<ServicePlan>> getAllPlans(@RequestParam(required = false) Boolean activeOnly) {
        List<ServicePlan> plans = (activeOnly != null && activeOnly)
                ? servicePlanService.getActivePlans()
                : servicePlanService.getAllPlans();
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/onvo-raw")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<?> getOnvoPrices() {
        List<Map<String, Object>> onvoPrices = servicePlanService.getPlansFromOnvo();
        return ResponseEntity.ok(onvoPrices);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ServicePlan> getPlanById(@PathVariable UUID id) {
        return ResponseEntity.ok(servicePlanService.getPlanById(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ServicePlan> createPlan(
            @RequestParam("data") String requestJson,
            @RequestParam("file") MultipartFile file) {

        try {
            ServicePlanRequest dto = objectMapper.readValue(requestJson, ServicePlanRequest.class);

            ServicePlan created = servicePlanService.createPlan(dto, file);
            spellingCorrectionAsyncService.correctServicePlan(created.getId());
            return ResponseEntity.ok(created);
        } catch (InvalidFieldException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error al procesar el plan: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/checkout")
    public ResponseEntity<Map<String, String>> createCheckoutSession(@PathVariable UUID id) {
        Map<String, String> checkoutData = servicePlanService.createCheckoutSessionForPlan(id);
        return ResponseEntity.ok(checkoutData); 
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ServicePlan> updatePlan(
            @PathVariable UUID id,
            @ModelAttribute ServicePlanRequest dto,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        ServicePlan updated = servicePlanService.updatePlan(id, dto, file);
        spellingCorrectionAsyncService.correctServicePlan(updated.getId());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}/image")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ServicePlan> deleteImage(@PathVariable UUID id) {
        return ResponseEntity.ok(servicePlanService.deleteImage(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<?> deletePlan(@PathVariable UUID id) {
        servicePlanService.deletePlan(id);
        return ResponseEntity.ok(Map.of("message", "Plan de servicio eliminado exitosamente"));
    }

}