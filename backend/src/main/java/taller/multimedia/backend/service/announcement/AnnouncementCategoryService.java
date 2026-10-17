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

@Service
@RequiredArgsConstructor
public class AnnouncementCategoryService {

    private final AnnouncementCategoryRepository categoryRepository;
    private final AnnouncementRepository announcementRepository;
    private final AnnouncementService announcementService;

    @Transactional(readOnly = true)
    public List<AnnouncementCategoryResponse> getAll() {
        return categoryRepository.findAllByOrderByPositionAscTitleAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AnnouncementCategoryResponse create(AnnouncementCategoryRequest dto) {
        String title = Sanitizer.requireClean("title", dto.getTitle()).trim();
        if (categoryRepository.existsByTitleIgnoreCase(title)) {
            throw new InvalidFieldException("title", "Ya existe una categoría con ese nombre.");
        }

        AnnouncementCategory category = new AnnouncementCategory();
        category.setTitle(title);
        category.setPosition(categoryRepository.findMaxPosition() + 1);
        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public void delete(UUID id) {
        AnnouncementCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new InvalidFieldException("id", "La categoría no existe."));

        for (Announcement announcement : announcementRepository.findByCategoryId(id)) {
            announcementService.delete(announcement.getId());
        }

        categoryRepository.delete(category);
    }

    private AnnouncementCategoryResponse toResponse(AnnouncementCategory category) {
        return new AnnouncementCategoryResponse(category.getId(), category.getTitle(), category.getCode());
    }
}
