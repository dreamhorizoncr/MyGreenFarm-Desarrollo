package taller.multimedia.backend.controller.serviceplan;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import taller.multimedia.backend.dto.serviceplan.ServicePlanRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.serviceplan.ServicePlan;
import taller.multimedia.backend.service.serviceplan.ServicePlanService;
import taller.multimedia.backend.service.spelling.SpellingCorrectionAsyncService;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;
import java.util.UUID;

/**
 * Service plans. Reading the list is public; everything else is for the owner.
 */
@RestController
@RequestMapping("/api/service-plans")
@RequiredArgsConstructor
public class ServicePlanController {

    private final ServicePlanService servicePlanService;
    private final SpellingCorrectionAsyncService spellingCorrectionAsyncService;
    private final ObjectMapper objectMapper;

    /**
     * {@code GET /api/service-plans}
     *
     * @param activeOnly {@code true} to return only the plans shown to visitors
     * @param pageable page and size; plans are always sorted by name
     * @return the plans
     */
    @GetMapping
    public ResponseEntity<Page<ServicePlan>> getAllPlans(
            @RequestParam(required = false) Boolean activeOnly,
            @PageableDefault(size = 10, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(servicePlanService.getPlans(activeOnly, pageable));
    }

    /**
     * {@code GET /api/service-plans/{id}}
     *
     * @param id plan ID
     * @return the plan
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ServicePlan> getPlanById(@PathVariable UUID id) {
        return ResponseEntity.ok(servicePlanService.getPlanById(id));
    }

    /**
     * {@code POST /api/service-plans}, multipart: creates a plan with its image and corrects its
     * spelling in the background.
     *
     * @param requestJson plan data as JSON
     * @param file plan image
     * @return the created plan
     * @throws InvalidFieldException if a field is unsafe
     * @throws RuntimeException if the data cannot be read or the plan cannot be saved
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ServicePlan> createPlan(
            @RequestParam("data") String requestJson,
            @RequestParam("file") MultipartFile file) {

        try {
            ServicePlanRequest request = objectMapper.readValue(requestJson, ServicePlanRequest.class);

            ServicePlan created = servicePlanService.createPlan(request, file);
            spellingCorrectionAsyncService.correctServicePlan(created.getId());
            return ResponseEntity.ok(created);
        } catch (InvalidFieldException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error processing the plan: " + e.getMessage(), e);
        }
    }

    /**
     * {@code PUT /api/service-plans/{id}}, multipart.
     *
     * @param id plan ID
     * @param request new plan data, as form fields
     * @param file new image, optional
     * @return the updated plan
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ServicePlan> updatePlan(
            @PathVariable UUID id,
            @ModelAttribute ServicePlanRequest request,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        ServicePlan updated = servicePlanService.updatePlan(id, request, file);
        spellingCorrectionAsyncService.correctServicePlan(updated.getId());
        return ResponseEntity.ok(updated);
    }


    /**
     * {@code DELETE /api/service-plans/{id}}: deletes the plan and its image.
     *
     * @param id plan ID
     * @return a confirmation message
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<?> deletePlan(@PathVariable UUID id) {
        servicePlanService.deletePlan(id);
        return ResponseEntity.ok(Map.of("message", "Service plan deleted successfully"));
    }

}