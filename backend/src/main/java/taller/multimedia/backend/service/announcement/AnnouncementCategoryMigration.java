package taller.multimedia.backend.service.announcement;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.model.announcement.AnnouncementCategory;
import taller.multimedia.backend.repository.announcement.AnnouncementCategoryRepository;

/**
 * One-time data migration that runs at startup: announcements created before categories existed
 * only have a {@code type} column, so this assigns each of them to a category with the same code,
 * creating the category when needed.
 *
 * <p>It only touches announcements without a category, so running it again on every startup is
 * harmless.
 */
@Component
@RequiredArgsConstructor
public class AnnouncementCategoryMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AnnouncementCategoryMigration.class);

    private static final Map<String, String> DEFAULT_TITLES = Map.of(
            "NEWS", "Noticias",
            "EVENT", "Eventos",
            "NOTICE", "Avisos",
            "GENERAL", "General",
            "TRANSPORT", "Transporte");

    private static final List<String> DEFAULT_ORDER = List.of("NEWS", "EVENT", "NOTICE", "GENERAL", "TRANSPORT");

    private final AnnouncementCategoryRepository categoryRepository;
    private final JdbcTemplate jdbcTemplate;

    /**
     * Assigns a category to every announcement that still has none, processing the known types in
     * their default order.
     */
    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<String> pendingTypes = jdbcTemplate.queryForList(
                "SELECT DISTINCT type FROM announcements WHERE category_id IS NULL AND type IS NOT NULL", String.class);

        pendingTypes.stream()
                .sorted(Comparator.comparingInt(AnnouncementCategoryMigration::orderOf))
                .forEach(this::assignCategory);
    }

    /**
     * Finds or creates the category for an announcement type and assigns it to the announcements of
     * that type that have no category. If the default title is already taken, the type code is
     * appended to it.
     *
     * @param type legacy announcement type, for example {@code NEWS}
     */
    private void assignCategory(String type) {
        AnnouncementCategory category = categoryRepository.findByCode(type).orElseGet(() -> {
            AnnouncementCategory created = new AnnouncementCategory();
            created.setCode(type);
            String title = DEFAULT_TITLES.getOrDefault(type, type);
            created.setTitle(categoryRepository.existsByTitleIgnoreCase(title) ? title + " (" + type + ")" : title);
            created.setPosition(categoryRepository.findMaxPosition() + 1);
            return categoryRepository.saveAndFlush(created);
        });

        int updated = jdbcTemplate.update(
                "UPDATE announcements SET category_id = ? WHERE category_id IS NULL AND type = ?",
                category.getId(), type);
        log.info("News assigned to category {}: {}", category.getTitle(), updated);
    }

    /**
     * @param type legacy announcement type
     * @return its position in the default order; unknown types go last
     */
    private static int orderOf(String type) {
        int index = DEFAULT_ORDER.indexOf(type);
        return index < 0 ? DEFAULT_ORDER.size() : index;
    }
}
