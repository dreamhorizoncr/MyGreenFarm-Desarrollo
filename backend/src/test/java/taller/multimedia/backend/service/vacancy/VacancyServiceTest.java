package taller.multimedia.backend.service.vacancy;

import java.util.List;

import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.vacancy.VacancyRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.repository.vacancy.VacancyRepository;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class VacancyServiceTest {

    @Mock
    private VacancyRepository vacancyRepository;

    @InjectMocks
    private VacancyService vacancyService;

    private VacancyRequest requestWith(String title, String description) {
        VacancyRequest request = new VacancyRequest();
        request.setTitle(title);
        request.setDescription(description);
        request.setRequiredFields(List.of("applicantPhone"));
        return request;
    }

    @ParameterizedTest
    @ValueSource(strings = { "title", "description" })
    void createVacancy_rejectsMaliciousFieldsAndNeverSaves(String field) {
        String maliciousValue = "<script>alert(1)</script>x";
        VacancyRequest request = requestWith("Docente de sala cuna", "Descripción válida de la vacante");

        switch (field) {
            case "title" -> request.setTitle(maliciousValue);
            case "description" -> request.setDescription(maliciousValue);
            default -> throw new IllegalStateException("Campo no cubierto: " + field);
        }

        assertThrows(InvalidFieldException.class, () -> vacancyService.createVacancy(request));

        verify(vacancyRepository, never()).save(any());
    }
}
