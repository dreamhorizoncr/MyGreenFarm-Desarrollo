package taller.multimedia.backend.service.announcement;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.announcement.AnnouncementCategoryRequest;
import taller.multimedia.backend.dto.announcement.AnnouncementCategoryResponse;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.announcement.Announcement;
import taller.multimedia.backend.model.announcement.AnnouncementCategory;
import taller.multimedia.backend.repository.announcement.AnnouncementCategoryRepository;
import taller.multimedia.backend.repository.announcement.AnnouncementRepository;
import taller.multimedia.backend.util.Sanitizer;

/**
 * Manages the categories used to group announcements.
 */
@Service
@RequiredArgsConstructor
public class AnnouncementCategoryService {

    private final AnnouncementCategoryRepository categoryRepository;
    private final AnnouncementRepository announcementRepository;
    private final AnnouncementService announcementService;

    /**
     * @return all categories, ordered by position and then by title
     */
    @Transactional(readOnly = true)
    public List<AnnouncementCategoryResponse> getAll() {
        return categoryRepository.findAllByOrderByPositionAscTitleAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Creates a category at the end of the list.
     *
     * @param request category data; the title is sanitized and trimmed
     * @return the created category
     * @throws InvalidFieldException if the title is unsafe or another category already has it
     *     (case-insensitive)
     */
    @Transactional
    public AnnouncementCategoryResponse create(AnnouncementCategoryRequest request) {
        String title = Sanitizer.requireClean("title", request.getTitle()).trim();
        if (categoryRepository.existsByTitleIgnoreCase(title)) {
            throw new InvalidFieldException("title", "A category with that name already exists.");
        }

        AnnouncementCategory category = new AnnouncementCategory();
        category.setTitle(title);
        category.setPosition(categoryRepository.findMaxPosition() + 1);
        return toResponse(categoryRepository.save(category));
    }

    /**
     * Deletes a category together with all of its announcements (and their images).
     *
     * @param id category to delete
     * @throws InvalidFieldException if the category does not exist
     */
    @Transactional
    public void delete(UUID id) {
        AnnouncementCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new InvalidFieldException("id", "The category does not exist."));

        for (Announcement announcement : announcementRepository.findByCategoryId(id)) {
            announcementService.delete(announcement.getId());
        }

        categoryRepository.delete(category);
    }

    private AnnouncementCategoryResponse toResponse(AnnouncementCategory category) {
        return new AnnouncementCategoryResponse(category.getId(), category.getTitle(), category.getCode());
    }
}
