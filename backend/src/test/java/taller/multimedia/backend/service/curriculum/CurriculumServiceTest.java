package taller.multimedia.backend.service.curriculum;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.curriculum.ApplicationRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.curriculum.Curriculum;
import taller.multimedia.backend.model.curriculum.CurriculumStatus;
import taller.multimedia.backend.model.vacancy.Vacancy;
import taller.multimedia.backend.repository.curriculum.CurriculumRepository;
import taller.multimedia.backend.repository.vacancy.VacancyRepository;
import taller.multimedia.backend.service.EmailService;
import taller.multimedia.backend.service.StorageService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
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

    private Curriculum spontaneousApplication() {
        Curriculum curriculum = new Curriculum();
        curriculum.setId(UUID.randomUUID());
        curriculum.setApplicantName("Ana Pérez");
        curriculum.setApplicantEmail("ana@ejemplo.com");
        curriculum.setLanguage("es");
        return curriculum;
    }

    @Test
    void approve_assignsTheChosenVacancyToASpontaneousApplication() {
        Curriculum curriculum = spontaneousApplication();
        UUID vacancyId = UUID.randomUUID();
        Vacancy vacancy = new Vacancy();
        vacancy.setId(vacancyId);
        vacancy.setTitle("Docente de inglés");
        when(curriculumRepository.findById(curriculum.getId())).thenReturn(Optional.of(curriculum));
        when(curriculumRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(vacancyRepository.existsById(vacancyId)).thenReturn(true);
        when(vacancyRepository.findById(vacancyId)).thenReturn(Optional.of(vacancy));

        curriculumService.setStatus(curriculum.getId(), CurriculumStatus.APPROVED, "es", vacancyId);

        assertThat(curriculum.getVacancyId()).isEqualTo(vacancyId);
        verify(emailService).sendApplicationHiredEmail(eq(curriculum), eq("Docente de inglés"), any());
    }

    @Test
    void approve_withoutVacancySendsTheGeneralHiringEmail() {
        Curriculum curriculum = spontaneousApplication();
        when(curriculumRepository.findById(curriculum.getId())).thenReturn(Optional.of(curriculum));
        when(curriculumRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        curriculumService.setStatus(curriculum.getId(), CurriculumStatus.APPROVED, "es", null);

        assertThat(curriculum.getVacancyId()).isNull();
        verify(emailService).sendApplicationHiredEmail(eq(curriculum), isNull(), any());
    }
}
