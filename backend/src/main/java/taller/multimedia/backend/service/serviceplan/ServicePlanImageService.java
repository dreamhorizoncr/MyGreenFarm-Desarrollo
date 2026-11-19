package taller.multimedia.backend.service.serviceplan;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.util.ImageAltText;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import taller.multimedia.backend.dto.serviceplan.ServicePlanRequest;
import taller.multimedia.backend.model.serviceplan.ServicePlan;
import taller.multimedia.backend.repository.serviceplan.ServicePlanRepository;
import taller.multimedia.backend.service.storage.StorageService;
import taller.multimedia.backend.util.Sanitizer;

import java.util.UUID;

/**
 * Saves service plans together with their image in the service plans bucket. Field validation
 * happens before, in {@link ServicePlanService}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ServicePlanImageService {

    private final ServicePlanRepository servicePlanRepository;
    private final StorageService storageService;

    @Value("${supabase.s3.buckets.service-plans}")
    private String servicePlansBucket;

    /**
     * Uploads the image and creates an active plan. Payment gateway fields are left empty because
     * online payments are disabled.
     *
     * @param request plan data; schedule and included items are sanitized
     * @param file plan image in PNG, JPG, JPEG, WEBP or SVG format
     * @return the created plan
     * @throws IllegalArgumentException if there is no image or its format is not allowed
     * @throws taller.multimedia.backend.exception.InvalidFieldException if the schedule or included items are unsafe
     */
    @Transactional
    public ServicePlan createPlanWithImage(ServicePlanRequest request, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("You must select an image.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !isValidImageFormat(contentType)) {
            throw new IllegalArgumentException("Unsupported format. Only PNG, JPG, JPEG, WEBP and SVG are allowed.");
        }

        long uploadStart = System.currentTimeMillis();
        String imageUrl = storageService.uploadFile(file, servicePlansBucket, "service_images");
        log.info("Uploading the service plan image took {} ms", System.currentTimeMillis() - uploadStart);

        ServicePlan plan = new ServicePlan();
        plan.setGatewayPriceId("");
        plan.setName(request.getName());
        plan.setCurrency(request.getCurrency());
        plan.setDescription(request.getDescription()); 
        plan.setPrice(request.getPrice());
        plan.setType(request.getType());
        plan.setPaymentUrl("");
        plan.setImageUrl(imageUrl);
        plan.setSchedule(Sanitizer.requireClean("schedule", request.getSchedule()));
        plan.setIncludes(Sanitizer.requireClean("includes", request.getIncludes()));
        plan.setImageAlt(ImageAltText.clean(request.getImageAlt()));
        plan.setActive(true);
        return servicePlanRepository.save(plan);
    }

    /**
     * Updates a plan and, when a new image is sent, replaces the old file in storage. If the old
     * file cannot be deleted, the error is only logged.
     *
     * @param id plan ID
     * @param request new plan data
     * @param file new image, or {@code null} / empty to keep the current one
     * @return the updated plan
     * @throws IllegalArgumentException if the plan does not exist or the image format is not
     *     allowed
     */
    @Transactional
    public ServicePlan updatePlanWithImage(UUID id, ServicePlanRequest request, MultipartFile file) {
        ServicePlan existing = servicePlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plan configuration not found with ID: " + id));

        existing.setName(request.getName());
        existing.setDescription(request.getDescription());
        existing.setPrice(request.getPrice());
        existing.setCurrency(request.getCurrency());
        existing.setType(request.getType());
        existing.setSchedule(Sanitizer.requireClean("schedule", request.getSchedule()));
        existing.setIncludes(Sanitizer.requireClean("includes", request.getIncludes()));
        existing.setImageAlt(ImageAltText.clean(request.getImageAlt()));

        if (file != null && !file.isEmpty()) {
            String contentType = file.getContentType();
            if (contentType == null || !isValidImageFormat(contentType)) {
                throw new IllegalArgumentException("Unsupported format. Only PNG, JPG, JPEG, WEBP and SVG are allowed.");
            }

            if (existing.getImageUrl() != null && !existing.getImageUrl().isEmpty()) {
                String oldPath = extractPathFromUrl(existing.getImageUrl(), servicePlansBucket);
                if (oldPath != null) {
                    try {
                        long deleteStart = System.currentTimeMillis();
                        storageService.deleteFile(servicePlansBucket, oldPath);
                        log.info("Deleting the previous plan image took {} ms", System.currentTimeMillis() - deleteStart);
                    } catch (Exception e) {
                        log.warn("Could not delete the previous image from the bucket: {}", e.getMessage());
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

    /**
     * Deletes a plan and its image. If the image cannot be deleted from storage, the plan is still
     * deleted.
     *
     * @param id plan ID
     * @throws IllegalArgumentException if the plan does not exist
     */
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
                    log.warn("Could not delete the file from the bucket: {}", e.getMessage());
                }
            }
        }

        servicePlanRepository.delete(plan);
    }


    private boolean isValidImageFormat(String contentType) {
        return contentType.equals("image/png") ||
                contentType.equals("image/jpg") ||
                contentType.equals("image/jpeg") ||
                contentType.equals("image/webp") ||
                contentType.equals("image/svg+xml");
    }

    /**
     * @param fileUrl public URL of a stored file
     * @param bucketName bucket that contains the file
     * @return the file's path inside the bucket, or {@code null} if the URL does not belong to it
     */
    private String extractPathFromUrl(String fileUrl, String bucketName) {
        try {
            String marker = "/" + bucketName + "/";
            int index = fileUrl.indexOf(marker);
            if (index != -1) {
                return fileUrl.substring(index + marker.length());
            }
        } catch (Exception e) {
            log.warn("Error extracting the path from the URL: {}", e.getMessage());
        }
        return null;
    }
}