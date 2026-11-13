package taller.multimedia.backend.service.dashboard;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.dashboard.DashboardAppointmentResponse;
import taller.multimedia.backend.dto.dashboard.DashboardActivityResponse;
import taller.multimedia.backend.dto.dashboard.DashboardPriorityResponse;
import taller.multimedia.backend.dto.dashboard.DashboardSummaryResponse;
import taller.multimedia.backend.dto.dashboard.TeacherDashboardResponse;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.model.child.Child;
import taller.multimedia.backend.model.curriculum.Curriculum;
import taller.multimedia.backend.model.curriculum.CurriculumStatus;
import taller.multimedia.backend.model.evaluation.Evaluation;
import taller.multimedia.backend.model.expedient.Expedient;
import taller.multimedia.backend.model.forum.ForumArticle;
import taller.multimedia.backend.model.group.ChildGroup;
import taller.multimedia.backend.model.group.Group;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.announcement.AnnouncementRepository;
import taller.multimedia.backend.repository.appointment.AppointmentRepository;
import taller.multimedia.backend.repository.child.ChildRepository;
import taller.multimedia.backend.repository.curriculum.CurriculumRepository;
import taller.multimedia.backend.repository.evaluation.EvaluationRepository;
import taller.multimedia.backend.repository.expedient.ExpedientRepository;
import taller.multimedia.backend.repository.forum.ForumArticleRepository;
import taller.multimedia.backend.repository.gallery.GalleryRepository;
import taller.multimedia.backend.repository.group.GroupRepository;
import taller.multimedia.backend.repository.user.UserRepository;
import taller.multimedia.backend.repository.vacancy.VacancyRepository;
import taller.multimedia.backend.service.announcement.GeminiSummaryService;

@Service
@RequiredArgsConstructor
public class DashboardService {

        private static final Logger log = LoggerFactory.getLogger(DashboardService.class);

        private final AppointmentRepository appointmentRepository;
        private final ChildRepository childRepository;
        private final AnnouncementRepository announcementRepository;
        private final GalleryRepository galleryRepository;
        private final ForumArticleRepository forumArticleRepository;
        private final CurriculumRepository curriculumRepository;
        private final VacancyRepository vacancyRepository;
        private final GeminiSummaryService geminiSummaryService;
        private final DashboardSummaryCacheService dashboardSummaryCacheService;
        private final UserRepository userRepository;
        private final GroupRepository groupRepository;
        private final ExpedientRepository expedientRepository;
        private final EvaluationRepository evaluationRepository;

        private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

        private static final int EVALUATION_INTERVAL_DAYS = 90;

        private final Map<String, String> teacherSummaries = java.util.Collections.synchronizedMap(
                        new LinkedHashMap<>(64, 0.75f, true) {
                                @Override
                                protected boolean removeEldestEntry(Map.Entry<String, String> eldest) {
                                        return size() > 500;
                                }
                        });

        @Transactional(readOnly = true)
        public DashboardSummaryResponse getSummary(LocalDate date, boolean includeForum) {
                List<DashboardAppointmentResponse> appointments = appointmentRepository
                                .findByAppointmentDateGreaterThanEqualAndAppointmentDateLessThanOrderByAppointmentDateAsc(
                                                date.atStartOfDay(), date.plusDays(1).atStartOfDay())
                                .stream()
                                .map(DashboardAppointmentResponse::from)
                                .toList();

                LocalDateTime now = LocalDateTime.now();
                LocalDateTime activitySince = now.minusDays(30);
                PageRequest activityPage = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));
                List<DashboardActivityResponse> activities = new ArrayList<>();
                announcementRepository.findByCreatedAtAfterOrderByCreatedAtDesc(activitySince, activityPage)
                                .forEach(item -> activities.add(new DashboardActivityResponse(
                                                item.getId().toString(), "announcement", item.getTitle(),
                                                item.getCreatedAt(), "/admin/announcements")));
                galleryRepository.findByCreatedAtAfterOrderByCreatedAtDesc(activitySince, activityPage)
                                .forEach(item -> activities.add(new DashboardActivityResponse(
                                                item.getId().toString(), "gallery", item.getTitle(),
                                                item.getCreatedAt(), "/admin/gallery")));
                List<DashboardActivityResponse> sharedActivities = activities.stream()
                                .sorted(Comparator.comparing(DashboardActivityResponse::createdAt).reversed())
                                .limit(5)
                                .toList();
                if (includeForum) {
                        forumArticleRepository.findByCreatedAtAfterOrderByCreatedAtDesc(activitySince, activityPage)
                                        .forEach(item -> activities.add(new DashboardActivityResponse(
                                                        item.getId().toString(), "forum", item.getTitle(),
                                                        item.getCreatedAt(), "/admin/forum")));
                }
                activities.sort(Comparator.comparing(DashboardActivityResponse::createdAt).reversed());
                List<DashboardActivityResponse> limitedActivities = activities.stream().limit(5).toList();

                List<DashboardPriorityResponse> priorities = new ArrayList<>();
                appointmentRepository.findByAppointmentDateBetweenAndStatus(
                                date.atStartOfDay(), date.plusDays(7).atStartOfDay(), AppointmentStatus.PENDING)
                                .forEach(item -> priorities.add(new DashboardPriorityResponse(
                                                item.getId().toString(), "appointment",
                                                "Cita de " + item.getParentName(), item.getAppointmentDate(),
                                                item.getAppointmentDate().isBefore(now.plusDays(2)) ? "high" : "medium",
                                                "/admin/appointments")));

                curriculumRepository.findByStatusAndSubmittedAtAfterOrderBySubmittedAtDesc(
                                CurriculumStatus.PENDING, now.minusDays(30))
                                .stream().limit(5)
                                .forEach(item -> priorities.add(new DashboardPriorityResponse(
                                                item.getId().toString(), "curriculum",
                                                curriculumTitle(item), item.getSubmittedAt(), "medium",
                                                "/admin/curriculums")));
                priorities.sort(Comparator.comparing(DashboardPriorityResponse::dueAt));
                List<DashboardPriorityResponse> limitedPriorities = priorities.stream().limit(6).toList();
                String aiSummary = generateAiSummary(date, appointments, sharedActivities, limitedPriorities);

                return new DashboardSummaryResponse(
                                appointments,
                                appointmentRepository.countByStatus(AppointmentStatus.PENDING),
                                childRepository.countByIsActiveTrue(),
                                limitedActivities,
                                limitedPriorities,
                                aiSummary);
        }

        @Transactional(readOnly = true)
        public TeacherDashboardResponse getTeacherSummary(String email) {
                User teacher = userRepository.findByEmail(email)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

                List<Group> groups = groupRepository.findByTeacherId(teacher.getId());
                Map<Long, Child> children = new LinkedHashMap<>();
                List<TeacherDashboardResponse.Group> groupSummaries = groups.stream()
                                .sorted(Comparator.comparing(Group::getName, String.CASE_INSENSITIVE_ORDER))
                                .map(group -> {
                                        List<Child> active = group.getChildGroups().stream()
                                                        .map(ChildGroup::getChild)
                                                        .filter(Objects::nonNull)
                                                        .filter(child -> Boolean.TRUE.equals(child.getIsActive()))
                                                        .toList();
                                        active.forEach(child -> children.putIfAbsent(child.getId(), child));
                                        return new TeacherDashboardResponse.Group(group.getId(), group.getName(), active.size());
                                })
                                .toList();

                LocalDate today = LocalDate.now();
                List<DashboardPriorityResponse> priorities = new ArrayList<>();
                for (Child child : children.values()) {
                        String name = (child.getFirstName() + " " + child.getLastName()).trim();
                        Optional<Expedient> expedient = expedientRepository.findByChildId(child.getId());
                        if (expedient.isEmpty()) {
                                priorities.add(new DashboardPriorityResponse(
                                                "expedient-" + child.getId(), "expedient",
                                                "Crear el expediente de " + name, null, "high", "/admin/expedients"));
                                continue;
                        }
                        Optional<LocalDate> lastEvaluation = evaluationRepository.findByExpedientIdId(expedient.get().getId())
                                        .stream()
                                        .map(Evaluation::getEvaluationDate)
                                        .filter(Objects::nonNull)
                                        .max(Comparator.naturalOrder());
                        if (lastEvaluation.isEmpty()) {
                                priorities.add(new DashboardPriorityResponse(
                                                "evaluation-" + child.getId(), "evaluation",
                                                "Primera evaluación de " + name, null, "medium", "/admin/evaluations"));
                        } else if (lastEvaluation.get().isBefore(today.minusDays(EVALUATION_INTERVAL_DAYS))) {
                                priorities.add(new DashboardPriorityResponse(
                                                "evaluation-" + child.getId(), "evaluation",
                                                "Nueva evaluación de " + name,
                                                lastEvaluation.get().plusDays(EVALUATION_INTERVAL_DAYS).atStartOfDay(),
                                                "medium", "/admin/evaluations"));
                        }
                }
                priorities.sort(Comparator
                                .comparing((DashboardPriorityResponse item) -> "high".equals(item.priority()) ? 0 : 1)
                                .thenComparing(DashboardPriorityResponse::dueAt, Comparator.nullsLast(Comparator.naturalOrder()))
                                .thenComparing(DashboardPriorityResponse::title));

                Page<ForumArticle> articles = forumArticleRepository.findAllByAuthor_IdOrderByCreatedAtDesc(
                                teacher.getId(), PageRequest.of(0, 5));
                List<DashboardActivityResponse> activities = articles.stream()
                                .map(item -> new DashboardActivityResponse(
                                                item.getId().toString(), "forum", item.getTitle(), item.getCreatedAt(),
                                                "/admin/forum"))
                                .toList();

                long missingExpedients = priorities.stream().filter(item -> "expedient".equals(item.type())).count();
                long dueEvaluations = priorities.stream().filter(item -> "evaluation".equals(item.type())).count();
                String context = teacherAiContext(today, groupSummaries.size(), children.size(), missingExpedients,
                                dueEvaluations, articles.getTotalElements());

                return new TeacherDashboardResponse(
                                groupSummaries,
                                children.size(),
                                articles.getTotalElements(),
                                priorities.size(),
                                priorities.stream().limit(6).toList(),
                                activities,
                                teacherAiSummary(today, context));
        }

        static String teacherAiContext(LocalDate date, int groups, int children, long missingExpedients,
                        long dueEvaluations, long articles) {
                return """
                                Date: %s
                                Groups taught: %d
                                Active children in those groups: %d
                                Children without a record yet: %d
                                Children due a new evaluation: %d
                                Forum articles written: %d
                                """.formatted(date, groups, children, missingExpedients, dueEvaluations, articles);
        }

        private String teacherAiSummary(LocalDate date, String context) {
                String key = date + "|" + context;
                String cached = teacherSummaries.get(key);
                if (cached != null) {
                        return cached;
                }
                String summary = geminiSummaryService.generateTeacherDashboardSummary(context);
                if (summary == null || summary.isBlank()) {
                        log.error("Could not generate the teacher dashboard AI summary for {}", date);
                        summary = "";
                }
                teacherSummaries.put(key, summary);
                return summary;
        }

        private String generateAiSummary(
                        LocalDate date,
                        List<DashboardAppointmentResponse> appointments,
                        List<DashboardActivityResponse> activities,
                        List<DashboardPriorityResponse> priorities) {
                DashboardSummaryCacheService.SummaryReservation reservation =
                                dashboardSummaryCacheService.reserveGeneration(date);
                if (!reservation.shouldGenerate()) {
                        return reservation.summary() == null ? "" : reservation.summary();
                }

                String summary = geminiSummaryService.generateDashboardSummary(
                                aiContext(date, appointments, activities, priorities));
                if (summary == null || summary.isBlank()) {
                        log.error("Could not generate the dashboard AI summary for {}", date);
                        return "";
                }
                dashboardSummaryCacheService.saveSummary(date, summary);
                return summary;
        }

        static String aiContext(
                        LocalDate date,
                        List<DashboardAppointmentResponse> appointments,
                        List<DashboardActivityResponse> activities,
                        List<DashboardPriorityResponse> priorities) {
                String appointmentLines = appointments.stream()
                                .map(item -> "- " + item.appointmentDate().toLocalTime().format(TIME) + " | status: "
                                                + item.status())
                                .collect(Collectors.joining("\n"));
                String activityLines = activities.stream()
                                .collect(Collectors.groupingBy(DashboardActivityResponse::type, TreeMap::new,
                                                Collectors.counting()))
                                .entrySet().stream()
                                .map(entry -> "- " + entry.getKey() + ": " + entry.getValue() + " new")
                                .collect(Collectors.joining("\n"));
                String priorityLines = priorities.stream()
                                .map(item -> "- " + item.type()
                                                + (item.dueAt() == null ? "" : " | due: " + item.dueAt().toLocalDate())
                                                + " | priority: " + item.priority())
                                .collect(Collectors.joining("\n"));
                return """
                                Date: %s
                                Appointments of the day:
                                %s
                                Recent activity:
                                %s
                                Priority tasks:
                                %s
                                """.formatted(
                                date,
                                appointmentLines.isEmpty() ? "None" : appointmentLines,
                                activityLines.isEmpty() ? "None" : activityLines,
                                priorityLines.isEmpty() ? "None" : priorityLines);
        }

        private String curriculumTitle(Curriculum curriculum) {
                if (curriculum.getVacancyId() == null) {
                        return "Nuevo currículum recibido";
                }
                return vacancyRepository.findById(curriculum.getVacancyId())
                                .map(vacancy -> "Currículum recibido para " + vacancy.getTitle())
                                .orElse("Nuevo currículum recibido");
        }
}
