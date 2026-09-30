package taller.multimedia.backend.service.curriculum;

import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.curriculum.ApplicationRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.repository.curriculum.CurriculumRepository;
import taller.multimedia.backend.repository.vacancy.VacancyRepository;
import taller.multimedia.backend.service.EmailService;
import taller.multimedia.backend.service.StorageService;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CurriculumServiceTest {

    @Mock
    private CurriculumRepository curriculumRepository;

    @Mock
    private VacancyRepository vacancyRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private CurriculumService curriculumService;

    private ApplicationRequest requestWith(String applicantName, String applicantEmail, String applicantPhone) {
        ApplicationRequest request = new ApplicationRequest();
        request.setApplicantName(applicantName);
        request.setApplicantEmail(applicantEmail);
        request.setApplicantPhone(applicantPhone);
        request.setLanguage("es");
        return request;
    }

    @ParameterizedTest
    @ValueSource(strings = { "applicantName", "applicantEmail", "applicantPhone" })
    void submitApplication_rejectsMaliciousFieldsAndNeverSaves(String field) {
        String maliciousValue = "<script>alert(1)</script>x";
        ApplicationRequest request = requestWith("Ana Pérez", "ana@ejemplo.com", "+50688887777");

        switch (field) {
            case "applicantName" -> request.setApplicantName(maliciousValue);
            case "applicantEmail" -> request.setApplicantEmail(maliciousValue);
            case "applicantPhone" -> request.setApplicantPhone(maliciousValue);
            default -> throw new IllegalStateException("Campo no cubierto: " + field);
        }

        assertThrows(InvalidFieldException.class,
                () -> curriculumService.submitApplication(request, null, null));

        verify(curriculumRepository, never()).save(any());
        verify(emailService, never()).sendApplicationReceivedEmail(any(), any(), any());
    }
}
