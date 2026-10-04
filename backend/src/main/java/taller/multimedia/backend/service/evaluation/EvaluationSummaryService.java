package taller.multimedia.backend.service.evaluation;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import taller.multimedia.backend.model.evaluation.Evaluation;
import taller.multimedia.backend.model.expedient.Expedient;
import taller.multimedia.backend.repository.evaluation.EvaluationRepository;
import taller.multimedia.backend.repository.expedient.ExpedientRepository;
import taller.multimedia.backend.service.EmailService;
import taller.multimedia.backend.service.announcement.GeminiResumenService;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EvaluationSummaryService {
    private static final Logger log = LoggerFactory.getLogger(EvaluationSummaryService.class);

    private final ExpedientRepository expedientRepository;
    private final EvaluationRepository evaluationRepository;
    private final GeminiResumenService geminiResumenService;
    private final EmailService emailService;

    @Transactional (readOnly = true)
    public void generateAndSendSemiannualSummaries() {
        LocalDate sixMonthsAgo = LocalDate.now().minusMonths(6);
        List<Expedient> expedients = expedientRepository.findAll();

        for (Expedient expedient : expedients) {
            try {
                List<Evaluation> evaluations = evaluationRepository
                        .findByExpedientIdIdAndEvaluationDateAfter(expedient.getId(), sixMonthsAgo);

                if (evaluations.isEmpty()) {
                    log.info("No hay evaluaciones recientes para el expediente de: {}", expedient.getChild().getFirstName());
                    continue;
                }

                // 1. Formatear y consolidar las evaluaciones
                StringBuilder rawContent = new StringBuilder();
                for (Evaluation eval : evaluations) {
                    rawContent.append("Fecha: ").append(eval.getEvaluationDate()).append("\n")
                            .append("- Comunicación: ").append(eval.getCommunicationProgress()).append("\n")
                            .append("- Lenguaje: ").append(eval.getLanguageProgress()).append("\n")
                            .append("- Lectura: ").append(eval.getReadingProgress()).append("\n")
                            .append("- Motor: ").append(eval.getMotorProgress()).append("\n")
                            .append("- Observación: ").append(eval.getTeacherObservation()).append("\n\n");
                }

                String childFullName = expedient.getChild().getFirstName() + " " + expedient.getChild().getLastName();

                // 2. Generar resumen mediante Gemini
                String summary = geminiResumenService.generateSemiannualEvaluationSummary(childFullName, rawContent.toString());

                if (summary == null || summary.isBlank()) {
                    log.error("No se pudo generar el resumen IA para el niño ID: {}", expedient.getChild().getId());
                    continue;
                }

                var parent = expedient.getChild().getParent();
                if (parent == null) {
                    log.error("El niño ID: {} no tiene un padre asignado.", expedient.getChild().getId());
                    continue;
                }

                // 3. Obtener el email del encargado/padre desde la entidad Child/Parent y enviar el correo
                String parentEmail = expedient.getChild().getParent().getEmail(); 
                String period = "Semestre " + (LocalDate.now().getMonthValue() <= 6 ? "I" : "II") + " - " + LocalDate.now().getYear();
                String parentLanguage = parent.getLanguage() != null ? parent.getLanguage() : "es";

                emailService.sendSemiannualEvaluationSummaryEmail(parentEmail, childFullName, summary, period, parentLanguage);

            } catch (Exception e) {
                log.error("Error procesando resumen para expediente ID {}: {}", expedient.getId(), e.getMessage(), e);
            }
        }
    }
}
