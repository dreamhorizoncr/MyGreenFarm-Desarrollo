package taller.multimedia.backend.service.expedient;

import java.time.LocalDate;

import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.expedient.ExpedientRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.expedient.EducationalLevel;
import taller.multimedia.backend.repository.expedient.ExpedientRepository;
import taller.multimedia.backend.service.StorageService;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ExpedientServiceTest {

    @Mock
    private ExpedientRepository expedientRepository;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private ExpedientService expedientService;

    private ExpedientRequest requestWith(String childName, String generalObservations) {
        ExpedientRequest request = new ExpedientRequest();
        request.setChildName(childName);
        request.setAdmisionDate(LocalDate.now());
        request.setEducationalLevel(EducationalLevel.KINDER);
        request.setGeneralObservations(generalObservations);
        return request;
    }

    @ParameterizedTest
    @ValueSource(strings = { "childName", "generalObservations" })
    void createExpedient_rejectsMaliciousFieldsAndNeverSaves(String field) {
        String maliciousValue = "<script>alert(1)</script>x";
        ExpedientRequest request = requestWith("Pedrito", "Le gusta dibujar");

        switch (field) {
            case "childName" -> request.setChildName(maliciousValue);
            case "generalObservations" -> request.setGeneralObservations(maliciousValue);
            default -> throw new IllegalStateException("Campo no cubierto: " + field);
        }

        assertThrows(InvalidFieldException.class, () -> expedientService.createExpedient(request, null));

        verify(expedientRepository, never()).save(any());
    }
}
