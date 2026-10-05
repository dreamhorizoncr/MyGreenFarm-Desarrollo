package taller.multimedia.backend.service.expedient;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.expedient.ExpedientRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.child.Child;
import taller.multimedia.backend.model.expedient.EducationalLevel;
import taller.multimedia.backend.repository.child.ChildRepository;
import taller.multimedia.backend.repository.expedient.ExpedientRepository;
import taller.multimedia.backend.service.StorageService;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpedientServiceTest {

    @Mock
    private ExpedientRepository expedientRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private ChildRepository childRepository;

    @InjectMocks
    private ExpedientService expedientService;

    private ExpedientRequest requestWith(String studentId, String generalObservations) {
        ExpedientRequest request = new ExpedientRequest();
        request.setStudentId(studentId);
        request.setAdmisionDate(LocalDate.now());
        request.setEducationalLevel(EducationalLevel.KINDER);
        request.setGeneralObservations(generalObservations);
        return request;
    }

    @Test
    void createExpedient_rejectsMaliciousGeneralObservationsAndNeverSaves() {
        String studentId = "A6001";
        String maliciousObservations = "<script>alert(1)</script>x";

        Child mockChild = new Child();
        mockChild.setId(1L);
        mockChild.setFirstName("Pedrito");
        mockChild.setLastName("Pérez");
        mockChild.setStudentId(studentId);

        // Simular que el niño sí existe buscando por su studentId
        when(childRepository.findByStudentId(studentId)).thenReturn(Optional.of(mockChild));

        ExpedientRequest request = requestWith(studentId, maliciousObservations);

        // Verifica que la llamada lance InvalidFieldException debido al Sanitizer
        assertThrows(InvalidFieldException.class, () -> expedientService.createExpedient(request, null));

        // Garantiza que nunca se intente persistir en el repositorio
        verify(expedientRepository, never()).save(any());
    }
}
