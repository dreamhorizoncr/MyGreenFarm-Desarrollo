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

    @Scheduled(cron = "0 0 8 30 6,12 ?")
    public void processSemiannualSummaries() {
        log.info("Starting scheduled task: generating and sending semester evaluation summaries.");
        evaluationSummaryService.generateAndSendSemiannualSummaries();
        log.info("Semester summaries scheduled task finished.");
    }
}
