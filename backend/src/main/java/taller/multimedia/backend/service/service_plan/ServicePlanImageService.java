package taller.multimedia.backend.service.service_plan;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.util.ImageAltText;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import taller.multimedia.backend.dto.service_plan.ServicePlanRequest;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;
import taller.multimedia.backend.service.StorageService;
import taller.multimedia.backend.util.Sanitizer;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServicePlanImageService {

    private final ServicePlanRepository servicePlanRepository;
    private final StorageService storageService;

    @Value("${supabase.s3.buckets.service-plans}")
    private String servicePlansBucket;

    @Transactional
    public ServicePlan createPlanWithImage(ServicePlanRequest dto, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("You must select an image.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !isValidImageFormat(contentType)) {
            throw new IllegalArgumentException("Unsupported format. Only PNG, JPG, JPEG and SVG are allowed.");
        }

        long uploadStart = System.currentTimeMillis();
        String imageUrl = storageService.uploadFile(file, servicePlansBucket, "service_images");
        log.info("Uploading the service plan image took {} ms", System.currentTimeMillis() - uploadStart);

        ServicePlan plan = new ServicePlan();
        plan.setGatewayPriceId("");
        plan.setName(dto.getName());
        plan.setCurrency(dto.getCurrency());
        plan.setDescription(dto.getDescription()); 
        plan.setPrice(dto.getPrice());
        plan.setType(dto.getType());
        plan.setPaymentUrl("");
        plan.setImageUrl(imageUrl);
        plan.setSchedule(Sanitizer.requireClean("schedule", dto.getSchedule()));
        plan.setIncludes(Sanitizer.requireClean("includes", dto.getIncludes()));
        plan.setImageAlt(ImageAltText.clean(dto.getImageAlt()));
        plan.setActive(true);
        return servicePlanRepository.save(plan);
    }

    @Transactional
    public ServicePlan updatePlanWithImage(UUID id, ServicePlanRequest dto, MultipartFile file) {
        ServicePlan existing = servicePlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plan configuration not found with ID: " + id));

        existing.setName(dto.getName());
        existing.setDescription(dto.getDescription());
        existing.setPrice(dto.getPrice());
        existing.setCurrency(dto.getCurrency());
        existing.setType(dto.getType());
        existing.setSchedule(Sanitizer.requireClean("schedule", dto.getSchedule()));
        existing.setIncludes(Sanitizer.requireClean("includes", dto.getIncludes()));
        existing.setImageAlt(ImageAltText.clean(dto.getImageAlt()));

        if (file != null && !file.isEmpty()) {
            String contentType = file.getContentType();
            if (contentType == null || !isValidImageFormat(contentType)) {
                throw new IllegalArgumentException("Unsupported format. Only PNG, JPG, JPEG and SVG are allowed.");
            }

            if (existing.getImageUrl() != null && !existing.getImageUrl().isEmpty()) {
                String oldPath = extractPathFromUrl(existing.getImageUrl(), servicePlansBucket);
                if (oldPath != null) {
                    try {
                        long deleteStart = System.currentTimeMillis();
                        storageService.deleteFile(servicePlansBucket, oldPath);
                        log.info("Deleting the previous plan image took {} ms", System.currentTimeMillis() - deleteStart);
                    } catch (Exception e) {
                        System.err.println("Could not delete the previous image from the bucket: " + e.getMessage());
                    }
                }
            }

            long uploadStart = System.currentTimeMillis();
            String newImageUrl = storageService.uploadFile(file, servicePlansBucket, "service_images");
            log.info("Uploading the new service plan image took {} ms", System.currentTimeMillis() - uploadStart);
            existing.setImageUrl(newImageUrl);
        }

        return servicePlanRepository.save(existing);
    }

    @Transactional
    public void deletePlan(UUID id) {
        ServicePlan plan = servicePlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plan configuration not found with ID: " + id));

        if (plan.getImageUrl() != null && !plan.getImageUrl().isEmpty()) {
            String filePath = extractPathFromUrl(plan.getImageUrl(), servicePlansBucket);
            if (filePath != null && !filePath.isEmpty()) {
                try {
                    long deleteStart = System.currentTimeMillis();
                    storageService.deleteFile(servicePlansBucket, filePath);
                    log.info("Deleting the service plan image took {} ms", System.currentTimeMillis() - deleteStart);
                } catch (Exception e) {
                    System.err.println("Could not delete the file from the bucket: " + e.getMessage());
                }
            }
        }

        servicePlanRepository.delete(plan);
    }

    @Transactional
    public ServicePlan deleteImage(UUID id) {
        ServicePlan plan = servicePlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plan configuration not found with ID: " + id));

        if (plan.getImageUrl() != null && !plan.getImageUrl().isEmpty()) {
            String filePath = extractPathFromUrl(plan.getImageUrl(), servicePlansBucket);
            if (filePath != null && !filePath.isEmpty()) {
                try {
                    storageService.deleteFile(servicePlansBucket, filePath);
                } catch (Exception e) {
                    log.warn("Could not delete the plan image from the bucket: {}", e.getMessage());
                }
            }
            plan.setImageUrl(null);
        }

        return servicePlanRepository.save(plan);
    }

    private boolean isValidImageFormat(String contentType) {
        return contentType.equals("image/png") ||
                contentType.equals("image/jpg") ||
                contentType.equals("image/jpeg") ||
                contentType.equals("image/svg+xml");
    }

    private String extractPathFromUrl(String fileUrl, String bucketName) {
        try {
            String marker = "/" + bucketName + "/";
            int index = fileUrl.indexOf(marker);
            if (index != -1) {
                return fileUrl.substring(index + marker.length());
            }
        } catch (Exception e) {
            System.err.println("Error extracting the path from the URL: " + e.getMessage());
        }
        return null;
    }
}