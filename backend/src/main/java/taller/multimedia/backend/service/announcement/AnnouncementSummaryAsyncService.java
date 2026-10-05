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
    private final GeminiResumenService geminiResumenService;

    public AnnouncementSummaryAsyncService(
            AnnouncementRepository announcementRepository,
            GeminiResumenService geminiResumenService) {
        this.announcementRepository = announcementRepository;
        this.geminiResumenService = geminiResumenService;
    }

    @Async("taskExecutor")
    @Transactional
    public void generateSummaryAsync(UUID announcementId, boolean force) {
        try {
            Announcement announcement = announcementRepository.findById(announcementId)
                    .orElseThrow(() -> new RuntimeException("Anuncio no encontrado: " + announcementId));

            String contentHash = HashUtils.sha256(announcement.getContent());

            if (!force && contentHash.equals(announcement.getAiSummaryContentHash())) {
                return;
            }

            String summary = geminiResumenService.generateSummary(announcement.getContent());
            if (summary == null) {
                log.error("No se pudo generar el resumen IA para el anuncio {}", announcementId);
                return;
            }

            announcement.setAiSummary(summary);
            announcement.setAiSummaryContentHash(contentHash);
            announcementRepository.save(announcement);

            log.info("Resumen IA generado para el anuncio {}", announcementId);
        } catch (Exception e) {
            log.error("Error generando el resumen IA para el anuncio {}", announcementId, e);
        }
    }
    
}

