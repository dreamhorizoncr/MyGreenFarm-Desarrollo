package taller.multimedia.backend.service.announcement;

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

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<String> pendingTypes = jdbcTemplate.queryForList(
                "SELECT DISTINCT type FROM announcements WHERE category_id IS NULL AND type IS NOT NULL", String.class);

        pendingTypes.stream()
                .sorted((a, b) -> Integer.compare(orderOf(a), orderOf(b)))
                .forEach(this::assignCategory);
    }

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
        log.info("Noticias asignadas a la categoría {}: {}", category.getTitle(), updated);
    }

    private static int orderOf(String type) {
        int index = DEFAULT_ORDER.indexOf(type);
        return index < 0 ? DEFAULT_ORDER.size() : index;
    }
}
