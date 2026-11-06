package taller.multimedia.backend.service.dashboard;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.dashboard.DashboardAppointmentResponse;
import taller.multimedia.backend.dto.dashboard.DashboardActivityResponse;
import taller.multimedia.backend.dto.dashboard.DashboardPriorityResponse;
import taller.multimedia.backend.dto.dashboard.DashboardSummaryResponse;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.model.curriculum.Curriculum;
import taller.multimedia.backend.model.curriculum.CurriculumStatus;
import taller.multimedia.backend.repository.announcement.AnnouncementRepository;
import taller.multimedia.backend.repository.appointment.AppointmentRepository;
import taller.multimedia.backend.repository.child.ChildRepository;
import taller.multimedia.backend.repository.curriculum.CurriculumRepository;
import taller.multimedia.backend.repository.forum.ForumArticleRepository;
import taller.multimedia.backend.repository.gallery.GalleryRepository;
import taller.multimedia.backend.repository.vacancy.VacancyRepository;
import taller.multimedia.backend.service.announcement.GeminiResumenService;

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
        private final GeminiResumenService geminiResumenService;
        private final DashboardSummaryCacheService dashboardSummaryCacheService;

        @Transactional(readOnly = true)
        public DashboardSummaryResponse getSummary(LocalDate date) {
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
                                                item.getCreatedAt(), "/admin/noticias")));
                galleryRepository.findByCreatedAtAfterOrderByCreatedAtDesc(activitySince, activityPage)
                                .forEach(item -> activities.add(new DashboardActivityResponse(
                                                item.getId().toString(), "gallery", item.getTitle(),
                                                item.getCreatedAt(), "/admin/galeria")));
                forumArticleRepository.findByCreatedAtAfterOrderByCreatedAtDesc(activitySince, activityPage)
                                .forEach(item -> activities.add(new DashboardActivityResponse(
                                                item.getId().toString(), "forum", item.getTitle(), item.getCreatedAt(),
                                                "/foro")));
                activities.sort(Comparator.comparing(DashboardActivityResponse::createdAt).reversed());
                List<DashboardActivityResponse> limitedActivities = activities.stream().limit(5).toList();

                List<DashboardPriorityResponse> priorities = new ArrayList<>();
                appointmentRepository.findByAppointmentDateBetweenAndStatus(
                                date.atStartOfDay(), date.plusDays(7).atStartOfDay(), AppointmentStatus.PENDING)
                                .forEach(item -> priorities.add(new DashboardPriorityResponse(
                                                item.getId().toString(), "appointment",
                                                "Cita de " + item.getParentName(), item.getAppointmentDate(),
                                                item.getAppointmentDate().isBefore(now.plusDays(2)) ? "high" : "medium",
                                                "/admin/citas")));

                curriculumRepository.findByStatusAndSubmittedAtAfterOrderBySubmittedAtDesc(
                                CurriculumStatus.PENDING, now.minusDays(30))
                                .stream().limit(5)
                                .forEach(item -> priorities.add(new DashboardPriorityResponse(
                                                item.getId().toString(), "curriculum",
                                                curriculumTitle(item), item.getSubmittedAt(), "medium",
                                                "/admin/curriculums")));
                priorities.sort(Comparator.comparing(DashboardPriorityResponse::dueAt));
                List<DashboardPriorityResponse> limitedPriorities = priorities.stream().limit(6).toList();
                String aiSummary = generateAiSummary(date, appointments, limitedActivities, limitedPriorities);

                return new DashboardSummaryResponse(
                                appointments,
                                appointmentRepository.countByStatus(AppointmentStatus.PENDING),
                                childRepository.countByIsActiveTrue(),
                                limitedActivities,
                                limitedPriorities,
                                aiSummary);
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

                String context = """
                                Fecha: %s
                                Citas del día:
                                %s
                                Actividad reciente:
                                %s
                                Pendientes prioritarios:
                                %s
                                """.formatted(
                                date,
                                appointments.isEmpty() ? "Ninguna" : appointments.stream()
                                                .map(item -> "- " + item.appointmentDate() + " | "
                                                                + item.parentName() + " | " + item.childName()
                                                                + " | estado: " + item.status())
                                                .reduce((left, right) -> left + "\n" + right).orElse("Ninguna"),
                                activities.isEmpty() ? "Ninguna" : activities.stream()
                                                .map(item -> "- " + item.type() + " | " + item.title())
                                                .reduce((left, right) -> left + "\n" + right).orElse("Ninguna"),
                                priorities.isEmpty() ? "Ninguno" : priorities.stream()
                                                .map(item -> "- " + item.type() + " | " + item.title()
                                                                + " | prioridad: " + item.priority())
                                                .reduce((left, right) -> left + "\n" + right).orElse("Ninguno"));

                String summary = geminiResumenService.generateDashboardSummary(context);
                if (summary == null || summary.isBlank()) {
                        log.error("No se pudo generar el resumen IA del dashboard para {}", date);
                        return "";
                }
                dashboardSummaryCacheService.saveSummary(date, summary);
                return summary;
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
