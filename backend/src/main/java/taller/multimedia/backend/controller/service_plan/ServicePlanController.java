package taller.multimedia.backend.controller.service_plan;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import taller.multimedia.backend.dto.service_plan.ServicePlanRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.onvo.PaymentRecord;
import taller.multimedia.backend.model.onvo.PaymentStatus;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.onvo.PaymentRecordRepository;
import taller.multimedia.backend.service.service_plan.ServicePlanService;
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
    private final ObjectMapper objectMapper;
    private final PaymentRecordRepository paymentRecordRepository;

    // Catálogo público: cualquier visitante puede ver los planes activos o todos
    @GetMapping
    public ResponseEntity<List<ServicePlan>> getAllPlans(@RequestParam(required = false) Boolean activeOnly) {
        List<ServicePlan> plans = (activeOnly != null && activeOnly)
                ? servicePlanService.getActivePlans()
                : servicePlanService.getAllPlans();
        return ResponseEntity.ok(plans);
    }

    // Ideal para llenar el dropbox
    @GetMapping("/onvo-raw")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<?> getOnvoPrices() {
        List<Map<String, Object>> onvoPrices = servicePlanService.getPlansFromOnvo();
        return ResponseEntity.ok(onvoPrices);
    }

    // Obtener un plan específico por ID (solo para la dueña)
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ServicePlan> getPlanById(@PathVariable UUID id) {
        return ResponseEntity.ok(servicePlanService.getPlanById(id));
    }

    // Crear un nuevo plan con su imagen y datos desde el panel de la dueña
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ServicePlan> createPlan(
            @RequestParam("data") String requestJson,
            @RequestParam("file") MultipartFile file) {

        try {
            // Convierte el texto JSON en tu DTO con la misma lógica que ya te funciona
            ServicePlanRequest dto = objectMapper.readValue(requestJson, ServicePlanRequest.class);

            ServicePlan created = servicePlanService.createPlan(dto, file);
            return ResponseEntity.ok(created);
        } catch (InvalidFieldException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error al procesar el plan: " + e.getMessage());
        }
    }

    //Endpoint para que el cliente genere su enlace de pago en OnvoPay al hacer clic en un plan
    
    @PostMapping("/{id}/checkout")
    public ResponseEntity<Map<String, String>> createCheckoutSession(@PathVariable UUID id) {
        Map<String, String> checkoutData = servicePlanService.createCheckoutSessionForPlan(id);
        return ResponseEntity.ok(checkoutData); 
    }

    // Actualizar un plan existente
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ServicePlan> updatePlan(
            @PathVariable UUID id,
            @ModelAttribute ServicePlanRequest dto,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        ServicePlan updated = servicePlanService.updatePlan(id, dto, file);
        return ResponseEntity.ok(updated);
    }

    // Eliminar un plan y su imagen asociada del bucket
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<?> deletePlan(@PathVariable UUID id) {
        servicePlanService.deletePlan(id);
        return ResponseEntity.ok(Map.of("message", "Plan de servicio eliminado exitosamente"));
    }

    // @GetMapping("/status/{gatewaySessionId}")
    // public ResponseEntity<Map<String, Object>> checkStatus(@PathVariable String gatewaySessionId) {
    //     Optional<PaymentRecord> recordOpt = paymentRecordRepository.findByGatewaySessionId(gatewaySessionId);

    //     Map<String, Object> response = new HashMap<>();
    //     if (recordOpt.isPresent()) {
    //         PaymentRecord record = recordOpt.get();
    //         boolean isPaid = record.getStatus() == PaymentStatus.PAID;
    //         boolean isFailed = record.getStatus() == PaymentStatus.FAILED;

    //         response.put("isPaid", isPaid);
    //         response.put("isFailed", isFailed);
    //         response.put("status", record.getStatus());
    //     } else {
    //         response.put("isPaid", false);
    //         response.put("isFailed", false);
    //         response.put("status", "PENDING");
    //     }

    //     return ResponseEntity.ok(response);
    // }

    @GetMapping("/status/{gatewaySessionId}")
    public ResponseEntity<Map<String, Object>> checkPaymentStatus(@PathVariable String gatewaySessionId) {
        Map<String, Object> statusResponse = servicePlanService.checkPaymentStatus(gatewaySessionId);
        return ResponseEntity.ok(statusResponse);
    }
}