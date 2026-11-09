package taller.multimedia.backend.service.service_plan;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.service_plan.ServicePlanRequest;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;

@Service
@RequiredArgsConstructor
public class ServicePlanService {

    private final ServicePlanRepository servicePlanRepository;
    private final ServicePlanImageService servicePlanImagesService;

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
                .orElseThrow(() -> new IllegalArgumentException("Plan configuration not found with ID: " + id));
    }

    @Transactional
    public ServicePlan createPlan(ServicePlanRequest dto, MultipartFile file) {
        validateImageFileName(file);
        validateRequest(dto);
        return servicePlanImagesService.createPlanWithImage(dto, file);
    }

    @Transactional
    public ServicePlan updatePlan(UUID id, ServicePlanRequest dto, MultipartFile file) {
        validateImageFileName(file);
        validateRequest(dto);
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

    private void validateImageFileName(MultipartFile file) {
        if (file != null && file.getOriginalFilename() != null && file.getOriginalFilename().length() > 255) {
            throw new IllegalArgumentException(
                    "The image file name is too long (maximum 255 characters).");
        }
    }

    private void validateRequest(ServicePlanRequest dto) {
        if (dto.getName() == null || dto.getName().isBlank()
                || dto.getDescription() == null || dto.getDescription().isBlank()
                || dto.getDescription().length() > 500
                || dto.getPrice() == null || dto.getPrice().signum() <= 0
                || dto.getType() == null || dto.getType().isBlank()
                || dto.getCurrency() == null
                || !List.of("CRC", "USD").contains(dto.getCurrency().toUpperCase())
                || dto.getSchedule() == null || dto.getSchedule().isBlank() || dto.getSchedule().length() > 200
                || dto.getIncludes() == null || dto.getIncludes().isBlank() || dto.getIncludes().length() > 800) {
            throw new IllegalArgumentException("Complete the service details.");
        }
    }
}
