package taller.multimedia.backend.service.service_plan;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.service_plan.ServicePlanRequest;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;

@ExtendWith(MockitoExtension.class)
class ServicePlanServiceTest {

    @Mock
    private ServicePlanRepository servicePlanRepository;

    @Mock
    private ServicePlanImageService servicePlanImageService;

    @InjectMocks
    private ServicePlanService servicePlanService;

    @Test
    void createPlan_savesInformationalDetailsWithoutPaymentConfiguration() {
        ServicePlanRequest request = new ServicePlanRequest();
        request.setName("Plan mensual");
        request.setDescription("Descripción informativa");
        request.setPrice(new BigDecimal("100.00"));
        request.setType("MONTHLY");
        request.setCurrency("CRC");
        request.setSchedule("Lunes a viernes");
        request.setIncludes("Alimentación y materiales");
        ServicePlan expected = new ServicePlan();

        when(servicePlanImageService.createPlanWithImage(request, null)).thenReturn(expected);

        assertSame(expected, servicePlanService.createPlan(request, null));

        verify(servicePlanImageService).createPlanWithImage(request, null);
    }

    @Test
    void createPlan_rejectsIncompleteInformationBeforeSaving() {
        ServicePlanRequest request = new ServicePlanRequest();
        request.setName("Plan mensual");

        assertThrows(IllegalArgumentException.class, () -> servicePlanService.createPlan(request, null));

        verify(servicePlanImageService, never()).createPlanWithImage(request, null);
    }
}
