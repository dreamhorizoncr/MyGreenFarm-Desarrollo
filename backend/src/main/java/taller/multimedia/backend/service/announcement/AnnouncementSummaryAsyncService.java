package taller.multimedia.backend.service.announcement;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import taller.multimedia.backend.model.announcement.Announcement;
import taller.multimedia.backend.repository.announcement.AnnouncementRepository;
import taller.multimedia.backend.utils.HashUtils;

@Service
public class AnnouncementSummaryAsyncService {

    private static final Logger log = LoggerFactory.getLogger(AnnouncementSummaryAsyncService.class);

    private final AnnouncementRepository announcementRepository;
    private final GeminiSummaryService geminiSummaryService;

    public AnnouncementSummaryAsyncService(
            AnnouncementRepository announcementRepository,
            GeminiSummaryService geminiSummaryService) {
        this.announcementRepository = announcementRepository;
        this.geminiSummaryService = geminiSummaryService;
    }

    @Async("taskExecutor")
    @Transactional
    public void generateSummaryAsync(UUID announcementId, boolean force) {
        try {
            Announcement announcement = announcementRepository.findById(announcementId)
                    .orElseThrow(() -> new RuntimeException("Announcement not found: " + announcementId));

            String contentHash = HashUtils.sha256(announcement.getContent());

            if (!force && contentHash.equals(announcement.getAiSummaryContentHash())) {
                return;
            }

            String summary = geminiSummaryService.generateSummary(announcement.getContent());
            if (summary == null) {
                log.error("Could not generate the AI summary for announcement {}", announcementId);
                return;
            }

            announcement.setAiSummary(summary);
            announcement.setAiSummaryContentHash(contentHash);
            announcementRepository.save(announcement);

            log.info("AI summary generated for announcement {}", announcementId);
        } catch (Exception e) {
            log.error("Error generating the AI summary for announcement {}", announcementId, e);
        }
    }
    
}

