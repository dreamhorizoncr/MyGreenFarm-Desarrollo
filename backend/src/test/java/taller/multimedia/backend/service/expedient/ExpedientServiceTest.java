package taller.multimedia.backend.service.expedient;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.expedient.ExpedientRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.child.Child;
import taller.multimedia.backend.model.expedient.EducationalLevel;
import taller.multimedia.backend.repository.child.ChildRepository;
import taller.multimedia.backend.repository.expedient.ExpedientRepository;
import taller.multimedia.backend.service.storage.StorageService;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
        request.setAdmissionDate(LocalDate.now());
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
        mockChild.setIsActive(true);

        when(childRepository.findByStudentId(studentId)).thenReturn(Optional.of(mockChild));

        ExpedientRequest request = requestWith(studentId, maliciousObservations);

        InvalidFieldException exception = assertThrows(InvalidFieldException.class, () -> expedientService.createExpedient(request, null));

        assertEquals("generalObservations", exception.getField());
        verify(expedientRepository, never()).save(any());
    }

    @Test
    void createExpedient_rejectsASecondRecordForTheSameChildWithA400() {
        Child child = new Child();
        child.setId(2L);
        child.setFirstName("Ana");
        child.setLastName("Pérez");
        child.setStudentId("A7001");
        child.setIsActive(true);
        when(childRepository.findByStudentId("A7001")).thenReturn(Optional.of(child));
        when(expedientRepository.existsByChildStudentId("A7001")).thenReturn(true);

        InvalidFieldException exception = assertThrows(InvalidFieldException.class,
                () -> expedientService.createExpedient(requestWith("A7001", null), null));

        assertEquals("studentId", exception.getField());
        verify(expedientRepository, never()).save(any());
    }
}
