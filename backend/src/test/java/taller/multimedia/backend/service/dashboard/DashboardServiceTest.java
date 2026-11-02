package taller.multimedia.backend.service.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
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

import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.repository.appointment.AppointmentRepository;
import taller.multimedia.backend.repository.child.ChildRepository;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private ChildRepository childRepository;

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

        var result = dashboardService.getSummary(date);

        assertThat(result.appointments()).hasSize(1);
        assertThat(result.appointments().getFirst().appointmentDate())
                .isEqualTo(LocalDateTime.of(date, LocalTime.of(9, 30)));
        assertThat(result.appointments().getFirst().parentName()).isEqualTo("Ana Pérez");
        assertThat(result.appointments().getFirst().childName()).isEqualTo("Lucía");
        assertThat(result.appointments().getFirst().status()).isEqualTo(AppointmentStatus.PENDING);
        assertThat(result.pendingAppointmentCount()).isEqualTo(3);
        assertThat(result.activeChildrenCount()).isEqualTo(12);
        verify(appointmentRepository).countByStatus(AppointmentStatus.PENDING);
        verify(childRepository).countByIsActiveTrue();
    }
}
