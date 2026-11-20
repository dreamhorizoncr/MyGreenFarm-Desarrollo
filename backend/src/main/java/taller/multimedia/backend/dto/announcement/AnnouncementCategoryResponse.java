package taller.multimedia.backend.dto.announcement;

import java.util.UUID;

/**
 * An announcement category.
 *
 * @param id category ID
 * @param title name shown to visitors
 * @param code legacy announcement type the category was created from, or {@code null} for new
 *     categories
 */
public record AnnouncementCategoryResponse(UUID id, String title, String code) {
}
