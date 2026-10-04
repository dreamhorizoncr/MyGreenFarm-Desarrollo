package taller.multimedia.backend.scheduler;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import taller.multimedia.backend.service.evaluation.EvaluationSummaryService;

@Component
@RequiredArgsConstructor
public class EvaluationSummaryScheduler {

    private static final Logger log = LoggerFactory.getLogger(EvaluationSummaryScheduler.class);
    private final EvaluationSummaryService evaluationSummaryService;

    // Se ejecuta el 30 de junio y el 15 de diciembre a las 08:00 AM
    @Scheduled(cron = "0 0 8 30 6,12 ?")
    public void processSemiannualSummaries() {
        log.info("Iniciando tarea programada: Generación y envío de resúmenes semestrales de evaluación.");
        evaluationSummaryService.generateAndSendSemiannualSummaries();
        log.info("Tarea programada de resúmenes semestrales finalizada.");
    }
}
