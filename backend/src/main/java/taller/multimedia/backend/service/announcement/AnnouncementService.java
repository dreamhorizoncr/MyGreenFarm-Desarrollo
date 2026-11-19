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
import lombok.extern.slf4j.Slf4j;

/**
 * News and announcements published on the site. Announcements are visible for 30 days and deleted
 * automatically afterwards.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementImageService announcementImageService;
    private final AnnouncementRepository announcementRepository;
    private final AnnouncementCategoryRepository announcementCategoryRepository;

    /**
     * Legacy type stored when the category has no code.
     */
    static final String FALLBACK_TYPE = "GENERAL";

    /**
     * @param request title, content (line breaks kept), category, event date and location; texts
     *     are sanitized
     * @return the created announcement
     * @throws IllegalArgumentException if another announcement has the same title
     * @throws InvalidFieldException if a text is unsafe or the category no longer exists
     */
    @Transactional
    public AnnouncementResponse create(AnnouncementRequest request) {
        String title = Sanitizer.requireClean("title", request.getTitle());
        String content = Sanitizer.requireCleanPreserveLineBreaks("content", request.getContent());
        String location = request.getLocation() == null ? null : Sanitizer.requireClean("location", request.getLocation());

        if (announcementRepository.existsByTitle(title)) {
            throw new IllegalArgumentException("An announcement already exists with the title: " + title);
        }

        Announcement announcement = new Announcement();
        announcement.setTitle(title);
        announcement.setContent(content);
        applyCategory(announcement, request.getCategoryId());
        announcement.setEventDate(request.getEventDate());
        announcement.setLocation(location);

        Announcement saved = announcementRepository.save(announcement);
        return mapToResponse(saved, "es");
    }

    /**
     * @param lang requested language (texts are returned as stored; translation happens elsewhere)
     * @param categoryId category to filter by, or {@code null} for all
     * @param pageable page to return
     * @return the announcements, including expired ones; for the admin panel
     */
    @Transactional(readOnly = true)
    public Page<AnnouncementResponse> getAll(String lang, UUID categoryId, Pageable pageable) {
        Page<Announcement> page = categoryId == null
                ? announcementRepository.findAll(pageable)
                : announcementRepository.findByCategoryId(categoryId, pageable);
        return page
                .map(announcement -> mapToResponse(announcement, lang));
    }

    /**
     * @param announcement entity
     * @param lang requested language
     * @return the response; announcements created before categories existed report their legacy
     *     type as the category code
     */
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

        response.setTitle(announcement.getTitle());

        response.setContent(announcement.getContent());

        return response;
    }

    /**
     * @param id announcement ID
     * @param request new data, sanitized as in {@link #create(AnnouncementRequest)}
     * @return the updated announcement
     * @throws RuntimeException if the announcement does not exist
     * @throws IllegalArgumentException if another announcement has the same title
     * @throws InvalidFieldException if a text is unsafe or the category no longer exists
     */
    @Transactional
    public AnnouncementResponse update(UUID id, AnnouncementRequest request) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found with ID: " + id));

        String title = Sanitizer.requireClean("title", request.getTitle());
        String content = Sanitizer.requireCleanPreserveLineBreaks("content", request.getContent());
        String location = request.getLocation() == null ? null : Sanitizer.requireClean("location", request.getLocation());

        if (announcementRepository.existsByTitleAndIdNot(title, id)) {
            throw new IllegalArgumentException("An announcement already exists with the title: " + title);
        }

        announcement.setTitle(title);
        announcement.setContent(content);
        applyCategory(announcement, request.getCategoryId());
        announcement.setEventDate(request.getEventDate());
        announcement.setLocation(location);

        Announcement updated = announcementRepository.save(announcement);
        return mapToResponse(updated, "es");
    }

    /**
     * Sets the category and keeps the legacy {@code type} column in sync with its code.
     *
     * @param announcement announcement to update
     * @param categoryId selected category
     * @throws InvalidFieldException if the category does not exist
     */
    private void applyCategory(Announcement announcement, UUID categoryId) {
        AnnouncementCategory category = announcementCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new InvalidFieldException("categoryId", "The selected category no longer exists."));
        announcement.setCategory(category);
        announcement.setType(category.getCode() != null ? category.getCode() : FALLBACK_TYPE);
    }

    /**
     * Deletes an announcement and its images.
     *
     * @param id announcement ID
     * @throws RuntimeException if it does not exist
     */
    @Transactional
    public void delete(UUID id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found with ID: " + id));

        announcementImageService.deleteAllImagesByAnnouncement(id);

        announcementRepository.delete(announcement);
    }

    /**
     * @param lang requested language
     * @param pageable page to return
     * @return announcements created in the last 30 days; this is what visitors see
     */
    @Transactional(readOnly = true)
    public Page<AnnouncementResponse> getAllActive(String lang, Pageable pageable) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        return announcementRepository.findByCreatedAtAfter(thirtyDaysAgo, pageable)
                .map(announcement -> mapToResponse(announcement, lang));
    }

    /**
     * Deletes the announcements older than 30 days, with their images, every day at 03:00. A
     * failure with one announcement is logged and the rest are still deleted.
     */
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
                log.warn("Error deleting expired announcement ID {}: {}", announcement.getId(), e.getMessage());
            }
        }
    }
}