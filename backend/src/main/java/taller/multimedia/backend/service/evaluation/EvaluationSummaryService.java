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
import taller.multimedia.backend.service.announcement.GeminiSummaryService;
import taller.multimedia.backend.service.translation.TranslationService;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EvaluationSummaryService {
    private static final Logger log = LoggerFactory.getLogger(EvaluationSummaryService.class);

    private final ExpedientRepository expedientRepository;
    private final EvaluationRepository evaluationRepository;
    private final GeminiSummaryService geminiSummaryService;
    private final EmailService emailService;
    private final TranslationService translationService;

    @Transactional (readOnly = true)
    public void generateAndSendSemiannualSummaries() {
        LocalDate sixMonthsAgo = LocalDate.now().minusMonths(6);
        List<Expedient> expedients = expedientRepository.findAll();

        for (Expedient expedient : expedients) {
            try {
                List<Evaluation> evaluations = evaluationRepository
                        .findByExpedientIdIdAndEvaluationDateAfterOrderByEvaluationDateAsc(expedient.getId(), sixMonthsAgo);

                if (evaluations.isEmpty()) {
                    log.info("No recent evaluations for the record of: {}", expedient.getChild().getFirstName());
                    continue;
                }

                StringBuilder rawContent = new StringBuilder();
                for (Evaluation eval : evaluations) {
                    rawContent.append("Date: ").append(eval.getEvaluationDate()).append("\n")
                            .append("- Communication: ").append(eval.getCommunicationProgress()).append("\n")
                            .append("- Language: ").append(eval.getLanguageProgress()).append("\n")
                            .append("- Reading: ").append(eval.getReadingProgress()).append("\n")
                            .append("- Motor: ").append(eval.getMotorProgress()).append("\n")
                            .append("- Observation: ").append(eval.getTeacherObservation()).append("\n\n");
                }

                String childFullName = expedient.getChild().getFirstName() + " " + expedient.getChild().getLastName();

                String summary = geminiSummaryService.generateSemiannualEvaluationSummary(childFullName, rawContent.toString());

                if (summary == null || summary.isBlank()) {
                    log.error("Could not generate the AI summary for child ID: {}", expedient.getChild().getId());
                    continue;
                }

                var parent = expedient.getChild().getParent();
                if (parent == null) {
                    log.error("Child ID: {} has no assigned parent.", expedient.getChild().getId());
                    continue;
                }

                String parentEmail = expedient.getChild().getParent().getEmail(); 
                String parentLanguage = parent.getLanguage() != null ? parent.getLanguage() : "es";
                String period = formatPeriodByLanguage(parentLanguage);

                String finalSummary = summary;
                if (!"es".equalsIgnoreCase(parentLanguage)) {
                    List<String> translations = translationService.translateBatchWithoutSaving(
                            List.of(summary), 
                            parentLanguage, 
                            "text/plain"
                    );
                    if (translations != null && !translations.isEmpty()) {
                        finalSummary = translations.get(0);
                    }
                }

                emailService.sendSemiannualEvaluationSummaryEmail(parentEmail, childFullName, finalSummary, period, parentLanguage);

            } catch (Exception e) {
                log.error("Error processing the summary for record ID {}: {}", expedient.getId(), e.getMessage(), e);
            }
        }
    }

    private String formatPeriodByLanguage(String languageCode) {
        int currentYear = LocalDate.now().getYear();
        boolean isFirstSemester = LocalDate.now().getMonthValue() <= 6;

        switch (languageCode.toLowerCase()) {
            case "en":
                return (isFirstSemester ? "Semester I" : "Semester II") + " - " + currentYear;
            case "fr":
                return (isFirstSemester ? "Semestre I" : "Semestre II") + " - " + currentYear;
            default:
                return (isFirstSemester ? "Semestre I" : "Semestre II") + " - " + currentYear;
        }
    }
}
