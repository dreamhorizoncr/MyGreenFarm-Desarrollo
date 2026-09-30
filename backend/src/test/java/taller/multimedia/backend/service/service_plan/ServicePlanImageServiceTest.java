package taller.multimedia.backend.service.service_plan;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import taller.multimedia.backend.dto.service_plan.ServicePlanRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;
import taller.multimedia.backend.service.StorageService;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServicePlanImageServiceTest {

    @Mock
    private ServicePlanRepository servicePlanRepository;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private ServicePlanImageService servicePlanImageService;

    private ServicePlanRequest validRequest() {
        ServicePlanRequest request = new ServicePlanRequest();
        request.setName("Plan mensual");
        request.setDescription("Descripción válida");
        request.setPrice(BigDecimal.TEN);
        request.setType("RECURRING");
        request.setGatewayPriceId("price_123");
        request.setSchedule("Lunes a viernes, 7am a 5pm");
        request.setIncludes("Alimentación, materiales");
        request.setPaymentUrl("https://checkout.onvopay.com/price_123");
        return request;
    }

    @Test
    void createPlanWithImage_rejectsAMaliciousScheduleAndNeverSaves() {
        ServicePlanRequest request = validRequest();
        request.setSchedule("<script>alert(1)</script>Lunes a viernes");

        MultipartFile file = new MockMultipartFile("file", "foto.png", "image/png", new byte[] { 1, 2, 3 });
        lenient().when(storageService.uploadFile(any(), any(), any())).thenReturn("https://bucket/foto.png");

        assertThrows(InvalidFieldException.class, () -> servicePlanImageService.createPlanWithImage(request, file));

        verify(servicePlanRepository, never()).save(any());
    }

    @Test
    void createPlanWithImage_rejectsMaliciousIncludesAndNeverSaves() {
        ServicePlanRequest request = validRequest();
        request.setIncludes("<img src=x onerror=alert(1)>Alimentación");

        MultipartFile file = new MockMultipartFile("file", "foto.png", "image/png", new byte[] { 1, 2, 3 });
        lenient().when(storageService.uploadFile(any(), any(), any())).thenReturn("https://bucket/foto.png");

        assertThrows(InvalidFieldException.class, () -> servicePlanImageService.createPlanWithImage(request, file));

        verify(servicePlanRepository, never()).save(any());
    }

    @Test
    void updatePlanWithImage_rejectsAMaliciousScheduleAndNeverSaves() {
        UUID id = UUID.randomUUID();
        when(servicePlanRepository.findById(id)).thenReturn(Optional.of(new ServicePlan()));

        ServicePlanRequest request = validRequest();
        request.setSchedule("<script>alert(1)</script>Lunes a viernes");

        assertThrows(InvalidFieldException.class, () -> servicePlanImageService.updatePlanWithImage(id, request, null));

        verify(servicePlanRepository, never()).save(any());
    }
}
