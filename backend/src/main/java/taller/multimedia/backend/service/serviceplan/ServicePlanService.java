package taller.multimedia.backend.service.serviceplan;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.serviceplan.ServicePlanRequest;
import taller.multimedia.backend.model.serviceplan.ServicePlan;
import taller.multimedia.backend.repository.serviceplan.ServicePlanRepository;

/**
 * Service plans (prices and schedules) shown on the services page. Validates the data and delegates
 * image handling to {@link ServicePlanImageService}.
 */
@Service
@RequiredArgsConstructor
public class ServicePlanService {

    private final ServicePlanRepository servicePlanRepository;
    private final ServicePlanImageService servicePlanImagesService;

    /**
     * @return all plans, active and inactive
     */
    @Transactional(readOnly = true)
    public List<ServicePlan> getAllPlans() {
        return servicePlanRepository.findAll();
    }

    /**
     * @return only the plans shown to visitors
     */
    @Transactional(readOnly = true)
    public List<ServicePlan> getActivePlans() {
        return servicePlanRepository.findByIsActiveTrue();
    }

    /**
     * @param activeOnly {@code true} to return only active plans
     * @param pageable page and size; its sort is ignored
     * @return plans sorted alphabetically by name, ignoring case
     */
    @Transactional(readOnly = true)
    public Page<ServicePlan> getPlans(Boolean activeOnly, Pageable pageable) {
        Pageable alphabeticalPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Order.asc("name").ignoreCase(), Sort.Order.asc("id")));
        return Boolean.TRUE.equals(activeOnly)
                ? servicePlanRepository.findByIsActiveTrue(alphabeticalPageable)
                : servicePlanRepository.findAll(alphabeticalPageable);
    }

    /**
     * @param id plan ID
     * @return the plan
     * @throws IllegalArgumentException if it does not exist
     */
    @Transactional(readOnly = true)
    public ServicePlan getPlanById(UUID id) {
        return servicePlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plan configuration not found with ID: " + id));
    }

    /**
     * @param request plan data
     * @param file plan image, optional
     * @return the created plan
     * @throws IllegalArgumentException if the data is incomplete or the image name is longer than
     *     255 characters
     */
    @Transactional
    public ServicePlan createPlan(ServicePlanRequest request, MultipartFile file) {
        validateImageFileName(file);
        validateRequest(request);
        return servicePlanImagesService.createPlanWithImage(request, file);
    }

    /**
     * @param id plan ID
     * @param request new plan data
     * @param file new image, or {@code null} to keep the current one
     * @return the updated plan
     * @throws IllegalArgumentException if the plan does not exist, the data is incomplete or the
     *     image name is too long
     */
    @Transactional
    public ServicePlan updatePlan(UUID id, ServicePlanRequest request, MultipartFile file) {
        validateImageFileName(file);
        validateRequest(request);
        return servicePlanImagesService.updatePlanWithImage(id, request, file);
    }


    /**
     * Deletes a plan and its image from storage.
     *
     * @param id plan ID
     */
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

    /**
     * Checks the required fields and their limits: name, type and a positive price; description up
     * to 500 characters, schedule up to 200, included items up to 800; currency CRC or USD.
     *
     * @param request plan data
     * @throws IllegalArgumentException if any field is missing or out of range
     */
    private void validateRequest(ServicePlanRequest request) {
        if (request.getName() == null || request.getName().isBlank()
                || request.getDescription() == null || request.getDescription().isBlank()
                || request.getDescription().length() > 500
                || request.getPrice() == null || request.getPrice().signum() <= 0
                || request.getType() == null || request.getType().isBlank()
                || request.getCurrency() == null
                || !List.of("CRC", "USD").contains(request.getCurrency().toUpperCase())
                || request.getSchedule() == null || request.getSchedule().isBlank() || request.getSchedule().length() > 200
                || request.getIncludes() == null || request.getIncludes().isBlank() || request.getIncludes().length() > 800) {
            throw new IllegalArgumentException("Complete the service details.");
        }
    }
}
