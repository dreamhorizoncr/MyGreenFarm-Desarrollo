package taller.multimedia.backend.service.spelling;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.BiConsumer;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.model.announcement.Announcement;
import taller.multimedia.backend.model.club.Club;
import taller.multimedia.backend.model.forum.ForumArticle;
import taller.multimedia.backend.model.serviceplan.ServicePlan;
import taller.multimedia.backend.model.vacancy.Vacancy;
import taller.multimedia.backend.repository.announcement.AnnouncementRepository;
import taller.multimedia.backend.repository.club.ClubRepository;
import taller.multimedia.backend.repository.forum.ForumArticleRepository;
import taller.multimedia.backend.repository.serviceplan.ServicePlanRepository;
import taller.multimedia.backend.repository.vacancy.VacancyRepository;
import taller.multimedia.backend.service.announcement.AnnouncementSummaryAsyncService;
import taller.multimedia.backend.service.forum.ForumArticleSummaryAsyncService;

/**
 * Corrects the spelling of published texts in the background with AI, so saving content does not
 * wait for the AI provider.
 */
@Service
@RequiredArgsConstructor
public class SpellingCorrectionAsyncService {

    private static final Logger log = LoggerFactory.getLogger(SpellingCorrectionAsyncService.class);

    private final SpellingCorrectionService spellingCorrectionService;
    private final TransactionTemplate transactionTemplate;
    private final AnnouncementRepository announcementRepository;
    private final ForumArticleRepository articleRepository;
    private final VacancyRepository vacancyRepository;
    private final ClubRepository clubRepository;
    private final ServicePlanRepository servicePlanRepository;
    private final AnnouncementSummaryAsyncService announcementSummaryAsyncService;
    private final ForumArticleSummaryAsyncService articleSummaryAsyncService;

    /**
     * A text field of an entity that can be corrected.
     *
     * @param name field name sent to the corrector
     * @param getter reads the field
     * @param setter writes the corrected text
     * @param <T> entity type
     */
    private record TextField<T>(String name, Function<T, String> getter, BiConsumer<T, String> setter) {
    }

    /**
     * Corrects the title and content of an announcement and then refreshes its AI summary, even if
     * the correction failed.
     *
     * @param id announcement ID
     */
    @Async("taskExecutor")
    public void correctAnnouncement(UUID id) {
        try {
            correct("announcement", id, announcementRepository, List.of(
                    new TextField<>("title", Announcement::getTitle, Announcement::setTitle),
                    new TextField<>("content", Announcement::getContent, Announcement::setContent)));
        } finally {
            announcementSummaryAsyncService.generateSummaryAsync(id, false);
        }
    }

    /**
     * Corrects the title and content of a forum article and then refreshes its AI summary, even if
     * the correction failed.
     *
     * @param id article ID
     */
    @Async("taskExecutor")
    public void correctArticle(UUID id) {
        try {
            correct("forum article", id, articleRepository, List.of(
                    new TextField<>("title", ForumArticle::getTitle, ForumArticle::setTitle),
                    new TextField<>("content", ForumArticle::getContent, ForumArticle::setContent)));
        } finally {
            articleSummaryAsyncService.generateSummaryAsync(id, false);
        }
    }

    /**
     * Corrects the title and description of a vacancy.
     *
     * @param id vacancy ID
     */
    @Async("taskExecutor")
    public void correctVacancy(UUID id) {
        correct("vacancy", id, vacancyRepository, List.of(
                new TextField<>("title", Vacancy::getTitle, Vacancy::setTitle),
                new TextField<>("description", Vacancy::getDescription, Vacancy::setDescription)));
    }

    /**
     * Corrects the name, description and schedule of a club.
     *
     * @param id club ID
     */
    @Async("taskExecutor")
    public void correctClub(Long id) {
        correct("club", id, clubRepository, List.of(
                new TextField<>("name", Club::getName, Club::setName),
                new TextField<>("description", Club::getDescription, Club::setDescription),
                new TextField<>("schedule", Club::getSchedule, Club::setSchedule)));
    }

    /**
     * Corrects the name, description, schedule and included items of a service plan.
     *
     * @param id service plan ID
     */
    @Async("taskExecutor")
    public void correctServicePlan(UUID id) {
        correct("service plan", id, servicePlanRepository, List.of(
                new TextField<>("name", ServicePlan::getName, ServicePlan::setName),
                new TextField<>("description", ServicePlan::getDescription, ServicePlan::setDescription),
                new TextField<>("schedule", ServicePlan::getSchedule, ServicePlan::setSchedule),
                new TextField<>("includes", ServicePlan::getIncludes, ServicePlan::setIncludes)));
    }

    /**
     * Reads the fields, asks for corrections outside any transaction (the AI call can be slow) and
     * saves them in a new transaction.
     *
     * <p>A correction is only applied if the field still has the text that was sent, so an edit
     * made by a user while the AI was working is never overwritten. Errors are logged and never
     * propagated.
     *
     * @param label entity name used in the logs
     * @param id entity ID
     * @param repository repository of the entity
     * @param fields fields to correct
     * @param <T> entity type
     * @param <I> ID type
     */
    private <T, I> void correct(String label, I id, JpaRepository<T, I> repository, List<TextField<T>> fields) {
        try {
            Map<String, String> original = transactionTemplate.execute(status -> repository.findById(id)
                    .map(entity -> {
                        Map<String, String> texts = new LinkedHashMap<>();
                        fields.forEach(field -> texts.put(field.name(), field.getter().apply(entity)));
                        return texts;
                    })
                    .orElse(null));
            if (original == null) {
                return;
            }

            Map<String, String> corrections = spellingCorrectionService.correct(original);
            if (corrections.isEmpty()) {
                return;
            }

            transactionTemplate.executeWithoutResult(status -> repository.findById(id).ifPresent(entity -> {
                int applied = 0;
                for (TextField<T> field : fields) {
                    String corrected = corrections.get(field.name());
                    if (corrected != null && Objects.equals(field.getter().apply(entity), original.get(field.name()))) {
                        field.setter().accept(entity, corrected);
                        applied++;
                    }
                }
                if (applied > 0) {
                    repository.save(entity);
                    log.info("Spelling corrected in {} {}: {} field(s)", label, id, applied);
                }
            }));
        } catch (Exception e) {
            log.error("Error correcting the spelling of {} {}", label, id, e);
        }
    }
}
