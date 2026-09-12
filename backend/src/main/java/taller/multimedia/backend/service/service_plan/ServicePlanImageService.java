package taller.multimedia.backend.service.service_plan;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import taller.multimedia.backend.dto.service_plan.ServicePlanRequest;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;
import taller.multimedia.backend.service.StorageService;

import com.stripe.model.Price;
import com.stripe.model.Product;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ServicePlanImageService {

    private final ServicePlanRepository servicePlanRepository;
    private final StorageService storageService;

    @Value("${supabase.s3.buckets.service-plans}") // Asegúrate de tener esta propiedad en tu application.properties
    private String servicePlansBucket;

    @Transactional
    public ServicePlan createPlanWithImage(ServicePlanRequest dto, MultipartFile file) {
        if (servicePlanRepository.existsByStripePriceId(dto.getStripePriceId())) {
            throw new IllegalArgumentException("Ya existe un plan de servicio registrado con este precio de Stripe.");
        }
        
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Debe seleccionar una imagen obligatoriamente.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !isValidImageFormat(contentType)) {
            throw new IllegalArgumentException("Formato no permitido. Solo se permiten PNG, JPG, JPEG, SVG.");
        }

        String imageUrl = storageService.uploadFile(file, servicePlansBucket, "service_images");

        ServicePlan plan = new ServicePlan();
        plan.setStripePriceId(dto.getStripePriceId());
        plan.setImageUrl(imageUrl);
        plan.setSchedule(dto.getSchedule());
        plan.setIncludes(dto.getIncludes());
        plan.setActive(true);

        try {
            // Consultar la información directamente a Stripe usando el ID del precio
            Price stripePrice = Price.retrieve(dto.getStripePriceId());

            if (stripePrice.getUnitAmount() != null) {
                plan.setPrice(java.math.BigDecimal.valueOf(stripePrice.getUnitAmount())
                        .divide(java.math.BigDecimal.valueOf(100)));
            }

            if (stripePrice.getProduct() != null) {
                com.stripe.model.Product stripeProduct = com.stripe.model.Product.retrieve(stripePrice.getProduct());
                plan.setName(stripeProduct.getName());
                plan.setDescription(stripeProduct.getDescription());
            }

            if (stripePrice.getRecurring() != null) {
                String interval = stripePrice.getRecurring().getInterval(); // "month", "year", "week", "day"
                Long intervalCount = stripePrice.getRecurring().getIntervalCount(); // 1, 3, 6, etc.

                if (intervalCount != null && intervalCount > 1) {
                    // Ejemplo: "6_MONTHS" o "3_MONTHS"
                    plan.setType(intervalCount + "_" + interval.toUpperCase() + "S");
                } else if (interval != null) {
                    // Mapeo limpio para los casos de 1 (month -> MONTHLY, year -> YEARLY, etc.)
                    switch (interval.toLowerCase()) {
                        case "month":
                            plan.setType("MONTHLY");
                            break;
                        case "year":
                            plan.setType("ANNUALLY"); // o YEARLY
                            break;
                        case "week":
                            plan.setType("WEEKLY");
                            break;
                        case "day":
                            plan.setType("DAILY");
                            break;
                        default:
                            plan.setType(interval.toUpperCase());
                    }
                }
            } else {
                plan.setType("ONE_TIME");
            }

        } catch (com.stripe.exception.StripeException e) {
            throw new IllegalArgumentException("No se pudo obtener la información de Stripe: " + e.getMessage());
        }

        return servicePlanRepository.save(plan);
    }

    @Transactional
    public ServicePlan updatePlanWithImage(UUID id, ServicePlanRequest dto, MultipartFile file) {
        ServicePlan existing = servicePlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Configuración de plan no encontrada con ID: " + id));

        existing.setStripePriceId(dto.getStripePriceId());
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
                        storageService.deleteFile(servicePlansBucket, oldPath);
                    } catch (Exception e) {
                        System.err.println("No se pudo borrar la imagen anterior del bucket: " + e.getMessage());
                    }
                }
            }

            // Subir la nueva imagen
            String newImageUrl = storageService.uploadFile(file, servicePlansBucket, "service_images");
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
                    storageService.deleteFile(servicePlansBucket, filePath);
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