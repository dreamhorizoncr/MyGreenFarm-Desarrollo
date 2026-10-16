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
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.model.vacancy.Vacancy;
import taller.multimedia.backend.repository.announcement.AnnouncementRepository;
import taller.multimedia.backend.repository.club.ClubRepository;
import taller.multimedia.backend.repository.forum.ForumArticleRepository;
import taller.multimedia.backend.repository.service_plan.ServicePlanRepository;
import taller.multimedia.backend.repository.vacancy.VacancyRepository;
import taller.multimedia.backend.service.announcement.AnnouncementSummaryAsyncService;
import taller.multimedia.backend.service.forum.ForumArticleSummaryAsyncService;

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

    private record TextField<T>(String name, Function<T, String> getter, BiConsumer<T, String> setter) {
    }

    @Async("taskExecutor")
    public void correctAnnouncement(UUID id) {
        try {
            correct("noticia", id, announcementRepository, List.of(
                    new TextField<>("title", Announcement::getTitle, Announcement::setTitle),
                    new TextField<>("content", Announcement::getContent, Announcement::setContent)));
        } finally {
            announcementSummaryAsyncService.generateSummaryAsync(id, false);
        }
    }

    @Async("taskExecutor")
    public void correctArticle(UUID id) {
        try {
            correct("publicación del blog", id, articleRepository, List.of(
                    new TextField<>("title", ForumArticle::getTitle, ForumArticle::setTitle),
                    new TextField<>("content", ForumArticle::getContent, ForumArticle::setContent)));
        } finally {
            articleSummaryAsyncService.generateSummaryAsync(id, false);
        }
    }

    @Async("taskExecutor")
    public void correctVacancy(UUID id) {
        correct("vacante", id, vacancyRepository, List.of(
                new TextField<>("title", Vacancy::getTitle, Vacancy::setTitle),
                new TextField<>("description", Vacancy::getDescription, Vacancy::setDescription)));
    }

    @Async("taskExecutor")
    public void correctClub(Long id) {
        correct("club", id, clubRepository, List.of(
                new TextField<>("name", Club::getName, Club::setName),
                new TextField<>("description", Club::getDescription, Club::setDescription),
                new TextField<>("schedule", Club::getSchedule, Club::setSchedule)));
    }

    @Async("taskExecutor")
    public void correctServicePlan(UUID id) {
        correct("servicio", id, servicePlanRepository, List.of(
                new TextField<>("name", ServicePlan::getName, ServicePlan::setName),
                new TextField<>("description", ServicePlan::getDescription, ServicePlan::setDescription),
                new TextField<>("schedule", ServicePlan::getSchedule, ServicePlan::setSchedule),
                new TextField<>("includes", ServicePlan::getIncludes, ServicePlan::setIncludes)));
    }

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
                    log.info("Ortografía corregida en {} {}: {} campo(s)", label, id, applied);
                }
            }));
        } catch (Exception e) {
            log.error("Error corrigiendo la ortografía de {} {}", label, id, e);
        }
    }
}
