package taller.multimedia.backend.service.service_plan;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import taller.multimedia.backend.dto.service_plan.ServicePlanRequest;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;
import taller.multimedia.backend.service.StorageService;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServicePlanImageService {

    private final ServicePlanRepository servicePlanRepository;
    private final StorageService storageService;

    @Value("${supabase.s3.buckets.service-plans}")
    private String servicePlansBucket;

    @Value("${onvo.api.key}")
    private String onvoApiKey;

    @Value("${onvo.api.url}")
    private String onvoApiUrl;

    @Transactional
    public ServicePlan createPlanWithImage(ServicePlanRequest dto, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Debe seleccionar una imagen obligatoriamente.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !isValidImageFormat(contentType)) {
            throw new IllegalArgumentException("Formato no permitido. Solo se permiten PNG, JPG, JPEG, SVG.");
        }

        long uploadStart = System.currentTimeMillis();
        String imageUrl = storageService.uploadFile(file, servicePlansBucket, "service_images");
        log.info("Subir imagen de plan de servicio tardó: {} ms", System.currentTimeMillis() - uploadStart);

        ServicePlan plan = new ServicePlan();
        plan.setGatewayPriceId(dto.getGatewayPriceId());
        plan.setName(dto.getName());
        plan.setDescription(dto.getDescription()); 
        plan.setPrice(dto.getPrice());
        plan.setType(dto.getType());
        plan.setPaymentUrl(dto.getPaymentUrl());
        plan.setImageUrl(imageUrl);
        plan.setSchedule(dto.getSchedule());
        plan.setIncludes(dto.getIncludes());
        plan.setActive(true);

        return servicePlanRepository.save(plan);
    }

    @Transactional
    public ServicePlan updatePlanWithImage(UUID id, ServicePlanRequest dto, MultipartFile file) {
        ServicePlan existing = servicePlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Configuración de plan no encontrada con ID: " + id));

        existing.setGatewayPriceId(dto.getGatewayPriceId());
        existing.setSchedule(dto.getSchedule());
        existing.setIncludes(dto.getIncludes());

        // Si el usuario subió una nueva imagen, reemplazamos la anterior
        if (file != null && !file.isEmpty()) {
            String contentType = file.getContentType();
            if (contentType == null || !isValidImageFormat(contentType)) {
                throw new IllegalArgumentException("Formato no permitido. Solo se permiten PNG, JPG, JPEG, SVG.");
            }

            // Borrar la imagen vieja del bucket si existe
            if (existing.getImageUrl() != null && !existing.getImageUrl().isEmpty()) {
                String oldPath = extractPathFromUrl(existing.getImageUrl(), servicePlansBucket);
                if (oldPath != null) {
                    try {
                        long deleteStart = System.currentTimeMillis();
                        storageService.deleteFile(servicePlansBucket, oldPath);
                        log.info("Eliminar imagen anterior del plan tardó: {} ms", System.currentTimeMillis() - deleteStart);
                    } catch (Exception e) {
                        System.err.println("No se pudo borrar la imagen anterior del bucket: " + e.getMessage());
                    }
                }
            }

            // Subir la nueva imagen
            long uploadStart = System.currentTimeMillis();
            String newImageUrl = storageService.uploadFile(file, servicePlansBucket, "service_images");
            log.info("Subir nueva imagen de plan de servicio tardó: {} ms", System.currentTimeMillis() - uploadStart);
            existing.setImageUrl(newImageUrl);
        }

        return servicePlanRepository.save(existing);
    }

    @Transactional
    public void deletePlan(UUID id) {
        ServicePlan plan = servicePlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Configuración de plan no encontrada con ID: " + id));

        // Borrar el archivo físico del bucket de Supabase
        if (plan.getImageUrl() != null && !plan.getImageUrl().isEmpty()) {
            String filePath = extractPathFromUrl(plan.getImageUrl(), servicePlansBucket);
            if (filePath != null && !filePath.isEmpty()) {
                try {
                    long deleteStart = System.currentTimeMillis();
                    storageService.deleteFile(servicePlansBucket, filePath);
                    log.info("Eliminar imagen de plan de servicio tardó: {} ms", System.currentTimeMillis() - deleteStart);
                } catch (Exception e) {
                    System.err.println("No se pudo borrar el archivo físico del bucket: " + e.getMessage());
                }
            }
        }

        servicePlanRepository.delete(plan);
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
            System.err.println("Error al extraer la ruta de la URL: " + e.getMessage());
        }
        return null;
    }
}