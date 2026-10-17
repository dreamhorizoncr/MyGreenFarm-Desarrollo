package taller.multimedia.backend.service.announcement;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import taller.multimedia.backend.dto.announcement.AnnouncementRequest;
import taller.multimedia.backend.dto.announcement.AnnouncementResponse;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.announcement.Announcement;
import taller.multimedia.backend.model.announcement.AnnouncementCategory;
import taller.multimedia.backend.repository.announcement.AnnouncementCategoryRepository;
import taller.multimedia.backend.repository.announcement.AnnouncementRepository;
import taller.multimedia.backend.util.Sanitizer;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementImageService announcementImageService;
    private final AnnouncementRepository announcementRepository;
    private final AnnouncementCategoryRepository announcementCategoryRepository;

    static final String FALLBACK_TYPE = "GENERAL";

    @Transactional
    public AnnouncementResponse create(AnnouncementRequest dto) {
        String title = Sanitizer.requireClean("title", dto.getTitle());
        String content = Sanitizer.requireCleanPreserveLineBreaks("content", dto.getContent());
        String location = dto.getLocation() == null ? null : Sanitizer.requireClean("location", dto.getLocation());

        if (announcementRepository.existsByTitle(title)) {
            throw new IllegalArgumentException("Ya existe un anuncio con el título: " + title);
        }

        Announcement announcement = new Announcement();
        announcement.setTitle(title);
        announcement.setContent(content);
        applyCategory(announcement, dto.getCategoryId());
        announcement.setEventDate(dto.getEventDate());
        announcement.setLocation(location);

        Announcement saved = announcementRepository.save(announcement);
        return mapToResponse(saved, "es");
    }

    @Transactional(readOnly = true)
    public Page<AnnouncementResponse> getAll(String lang, Pageable pageable) {
        return announcementRepository.findAll(pageable)
                .map(announcement -> mapToResponse(announcement, lang));
    }

    private AnnouncementResponse mapToResponse(Announcement announcement, String lang) {
        AnnouncementResponse response = new AnnouncementResponse();
        response.setId(announcement.getId());
        AnnouncementCategory category = announcement.getCategory();
        if (category != null) {
            response.setCategoryId(category.getId());
            response.setCategoryTitle(category.getTitle());
            response.setCategoryCode(category.getCode());
        } else {
            response.setCategoryCode(announcement.getType());
        }
        response.setEventDate(announcement.getEventDate());
        response.setLocation(announcement.getLocation());
        response.setAiSummary(announcement.getAiSummary());

        if ("en".equals(lang) || "fr".equals(lang)) {
            response.setTitle(announcement.getTitle());
            response.setContent(announcement.getContent());
        } else {
            response.setTitle(announcement.getTitle());
            response.setContent(announcement.getContent());
        }

        return response;
    }

    @Transactional
    public AnnouncementResponse update(UUID id, AnnouncementRequest dto) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anuncio no encontrado con ID: " + id));

        String title = Sanitizer.requireClean("title", dto.getTitle());
        String content = Sanitizer.requireCleanPreserveLineBreaks("content", dto.getContent());
        String location = dto.getLocation() == null ? null : Sanitizer.requireClean("location", dto.getLocation());

        if (announcementRepository.existsByTitleAndIdNot(title, id)) {
            throw new IllegalArgumentException("Ya existe un anuncio con el título: " + title);
        }

        announcement.setTitle(title);
        announcement.setContent(content);
        applyCategory(announcement, dto.getCategoryId());
        announcement.setEventDate(dto.getEventDate());
        announcement.setLocation(location);

        Announcement updated = announcementRepository.save(announcement);
        return mapToResponse(updated, "es");
    }

    private void applyCategory(Announcement announcement, UUID categoryId) {
        AnnouncementCategory category = announcementCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new InvalidFieldException("categoryId", "La categoría seleccionada ya no existe."));
        announcement.setCategory(category);
        announcement.setType(category.getCode() != null ? category.getCode() : FALLBACK_TYPE);
    }

    @Transactional
    public void delete(UUID id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anuncio no encontrado con ID: " + id));

        announcementImageService.deleteAllImagesByAnnouncement(id);

        announcementRepository.delete(announcement);
    }

    @Transactional(readOnly = true)
    public Page<AnnouncementResponse> getAllActive(String lang, Pageable pageable) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        return announcementRepository.findByCreatedAtAfter(thirtyDaysAgo, pageable)
                .map(announcement -> mapToResponse(announcement, lang));
    }

    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupExpiredAnnouncements() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        
        List<Announcement> expiredAnnouncements = announcementRepository.findByCreatedAtBefore(thirtyDaysAgo);

        if (expiredAnnouncements.isEmpty()) {
            return;
        }

        for (Announcement announcement : expiredAnnouncements) {
            try {
                delete(announcement.getId());
            } catch (Exception e) {
                System.err.println("Error al eliminar anuncio expirado ID " + announcement.getId() + ": " + e.getMessage());
            }
        }
    }
}