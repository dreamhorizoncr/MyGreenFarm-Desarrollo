package taller.multimedia.backend.service.evaluation;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.evaluation.EvaluationRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.expedient.Expedient;
import taller.multimedia.backend.repository.evaluation.EvaluationRepository;
import taller.multimedia.backend.repository.expedient.ExpedientRepository;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EvaluationServiceTest {

    @Mock
    private EvaluationRepository evaluationRepository;

    @Mock
    private ExpedientRepository expedientRepository;

    @InjectMocks
    private EvaluationService evaluationService;

    private EvaluationRequest requestWith(UUID expedientId) {
        EvaluationRequest request = new EvaluationRequest();
        request.setExpedientId(expedientId);
        request.setEvaluationDate(LocalDate.now());
        request.setCommunicationProgress("Se comunica bien con sus compañeros");
        request.setLanguageProgress("Reconoce la mayoría de las letras");
        request.setReadingProgress("Lee palabras cortas");
        request.setMotorProgress("Buena motricidad fina");
        request.setTeacherObservation("Muy buen progreso este mes");
        return request;
    }

    @ParameterizedTest
    @ValueSource(strings = { "communicationProgress", "languageProgress", "readingProgress", "motorProgress",
            "teacherObservation" })
    void createEvaluation_rejectsMaliciousFieldsAndNeverSaves(String field) {
        UUID expedientId = UUID.randomUUID();
        lenient().when(expedientRepository.findById(expedientId)).thenReturn(Optional.of(new Expedient()));

        String maliciousValue = "<script>alert(1)</script>x";
        EvaluationRequest request = requestWith(expedientId);

        switch (field) {
            case "communicationProgress" -> request.setCommunicationProgress(maliciousValue);
            case "languageProgress" -> request.setLanguageProgress(maliciousValue);
            case "readingProgress" -> request.setReadingProgress(maliciousValue);
            case "motorProgress" -> request.setMotorProgress(maliciousValue);
            case "teacherObservation" -> request.setTeacherObservation(maliciousValue);
            default -> throw new IllegalStateException("Campo no cubierto: " + field);
        }

        assertThrows(InvalidFieldException.class, () -> evaluationService.createEvaluation(request));

        verify(evaluationRepository, never()).save(any());
    }

    @Test
    void createEvaluation_keepsTheLineBreaksInTheTeacherObservation() {
        UUID expedientId = UUID.randomUUID();
        when(expedientRepository.findById(expedientId)).thenReturn(Optional.of(new Expedient()));
        when(evaluationRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        String multilineObservation = "Primer punto.\n\nSegundo punto importante.";
        EvaluationRequest request = requestWith(expedientId);
        request.setTeacherObservation(multilineObservation);

        var saved = evaluationService.createEvaluation(request);

        org.junit.jupiter.api.Assertions.assertEquals(multilineObservation, saved.getTeacherObservation());
    }
}
