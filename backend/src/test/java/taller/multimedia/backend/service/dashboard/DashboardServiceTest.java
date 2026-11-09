package taller.multimedia.backend.service.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.repository.appointment.AppointmentRepository;
import taller.multimedia.backend.repository.child.ChildRepository;
import taller.multimedia.backend.repository.announcement.AnnouncementRepository;
import taller.multimedia.backend.repository.curriculum.CurriculumRepository;
import taller.multimedia.backend.repository.forum.ForumArticleRepository;
import taller.multimedia.backend.repository.gallery.GalleryRepository;
import taller.multimedia.backend.repository.vacancy.VacancyRepository;
import taller.multimedia.backend.service.announcement.GeminiSummaryService;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private ChildRepository childRepository;

    @Mock
    private AnnouncementRepository announcementRepository;

    @Mock
    private GalleryRepository galleryRepository;

    @Mock
    private ForumArticleRepository forumArticleRepository;

    @Mock
    private CurriculumRepository curriculumRepository;

    @Mock
    private VacancyRepository vacancyRepository;

    @Mock
    private GeminiSummaryService geminiSummaryService;

    @Mock
    private DashboardSummaryCacheService dashboardSummaryCacheService;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    void getSummaryReturnsAppointmentsForSelectedDayAndCurrentCounts() {
        LocalDate date = LocalDate.of(2026, 11, 1);
        Appointment appointment = new Appointment();
        appointment.setId(UUID.randomUUID());
        appointment.setAppointmentDate(date.atTime(9, 30));
        appointment.setParentName("Ana Pérez");
        appointment.setChildName("Lucía");
        appointment.setStatus(AppointmentStatus.PENDING);

        when(appointmentRepository
                .findByAppointmentDateGreaterThanEqualAndAppointmentDateLessThanOrderByAppointmentDateAsc(
                        date.atStartOfDay(), date.plusDays(1).atStartOfDay()))
                .thenReturn(List.of(appointment));
        when(appointmentRepository.countByStatus(AppointmentStatus.PENDING)).thenReturn(3L);
        when(childRepository.countByIsActiveTrue()).thenReturn(12L);
        when(appointmentRepository.findByAppointmentDateBetweenAndStatus(
                any(), any(), org.mockito.ArgumentMatchers.eq(AppointmentStatus.PENDING)))
                .thenReturn(List.of());
        when(announcementRepository.findByCreatedAtAfterOrderByCreatedAtDesc(any(), any(Pageable.class)))
                .thenReturn(Page.empty());
        when(galleryRepository.findByCreatedAtAfterOrderByCreatedAtDesc(any(), any(Pageable.class)))
                .thenReturn(Page.empty());
        when(forumArticleRepository.findByCreatedAtAfterOrderByCreatedAtDesc(any(), any(Pageable.class)))
                .thenReturn(Page.empty());
        when(curriculumRepository.findByStatusAndSubmittedAtAfterOrderBySubmittedAtDesc(
                org.mockito.ArgumentMatchers.eq(taller.multimedia.backend.model.curriculum.CurriculumStatus.PENDING), any()))
                .thenReturn(List.of());
        when(geminiSummaryService.generateDashboardSummary(any())).thenReturn("Resumen generado por Gemini.");
        when(dashboardSummaryCacheService.reserveGeneration(date))
                .thenReturn(new DashboardSummaryCacheService.SummaryReservation(null, true));

        var result = dashboardService.getSummary(date);

        assertThat(result.appointments()).hasSize(1);
        assertThat(result.appointments().getFirst().appointmentDate())
                .isEqualTo(LocalDateTime.of(date, LocalTime.of(9, 30)));
        assertThat(result.appointments().getFirst().parentName()).isEqualTo("Ana Pérez");
        assertThat(result.appointments().getFirst().childName()).isEqualTo("Lucía");
        assertThat(result.appointments().getFirst().status()).isEqualTo(AppointmentStatus.PENDING);
        assertThat(result.pendingAppointmentCount()).isEqualTo(3);
        assertThat(result.activeChildrenCount()).isEqualTo(12);
        assertThat(result.aiSummary()).isEqualTo("Resumen generado por Gemini.");
        verify(appointmentRepository).countByStatus(AppointmentStatus.PENDING);
        verify(childRepository).countByIsActiveTrue();
        verify(geminiSummaryService).generateDashboardSummary(any());
        verify(dashboardSummaryCacheService).saveSummary(date, "Resumen generado por Gemini.");
    }
}
