package taller.multimedia.backend.service.calendar;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.appointment.AppointmentRepository;
import taller.multimedia.backend.repository.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class CalendarEventServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CalendarEventService calendarEventService;

    @Test
    void getPlatformEvents_usesDatabaseAppointmentsAndRecurringTeacherBirthdays() {
        LocalDate from = LocalDate.of(2026, 11, 1);
        LocalDate to = LocalDate.of(2026, 11, 30);
        UUID appointmentId = UUID.randomUUID();
        Appointment appointment = new Appointment();
        appointment.setId(appointmentId);
        appointment.setAppointmentDate(LocalDateTime.of(2026, 11, 2, 9, 0));
        appointment.setChildName("Ana");
        appointment.setStatus(AppointmentStatus.CONFIRMED);

        User teacher = new User(
                "teacher@example.com",
                "password",
                "Laura",
                "Pérez",
                Role.TEACHER,
                LocalDate.of(1990, 11, 15),
                true);
        teacher.setId(UUID.randomUUID());

        when(appointmentRepository
                .findByAppointmentDateGreaterThanEqualAndAppointmentDateLessThanOrderByAppointmentDateAsc(
                        any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(appointment));
        when(userRepository.findByRole(Role.TEACHER)).thenReturn(List.of(teacher));

        var events = calendarEventService.getPlatformEvents(from, to);

        assertEquals(2, events.size());
        assertEquals("APPOINTMENT", events.get(0).type());
        assertEquals("2026-11-02", events.get(0).date());
        assertEquals("BIRTHDAY", events.get(1).type());
        assertEquals("2026-11-15", events.get(1).date());
        verify(userRepository).findByRole(Role.TEACHER);
    }

    @Test
    void getPlatformEvents_excludesBirthdaysOutsideRequestedRange() {
        when(appointmentRepository
                .findByAppointmentDateGreaterThanEqualAndAppointmentDateLessThanOrderByAppointmentDateAsc(
                        any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());
        User teacher = new User(
                "teacher@example.com",
                "password",
                "Laura",
                "Pérez",
                Role.TEACHER,
                LocalDate.of(1990, 12, 15),
                true);
        when(userRepository.findByRole(Role.TEACHER)).thenReturn(List.of(teacher));

        var events = calendarEventService.getPlatformEvents(
                LocalDate.of(2026, 11, 1),
                LocalDate.of(2026, 11, 30));

        assertEquals(0, events.size());
    }
}
