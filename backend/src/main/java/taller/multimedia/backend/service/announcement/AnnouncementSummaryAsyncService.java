package taller.multimedia.backend.service.announcement;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import taller.multimedia.backend.model.announcement.Announcement;
import taller.multimedia.backend.repository.announcement.AnnouncementRepository;

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

            String contenidoHash = sha256(announcement.getContent());

            if (!force && contenidoHash.equals(announcement.getResumenContenidoHash())) {
                return;
            }

            String resumen = geminiResumenService.generarResumen(announcement.getContent());
            if (resumen == null) {
                log.error("No se pudo generar el resumen IA para el anuncio {}", announcementId);
                return;
            }

            announcement.setResumenIA(resumen);
            announcement.setResumenContenidoHash(contenidoHash);
            announcementRepository.save(announcement);

            log.info("Resumen IA generado para el anuncio {}", announcementId);
        } catch (Exception e) {
            log.error("Error generando el resumen IA para el anuncio {}", announcementId, e);
        }
    }

    static String sha256(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hashBytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}
