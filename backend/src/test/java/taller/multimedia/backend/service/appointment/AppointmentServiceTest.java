package taller.multimedia.backend.service.appointment;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import taller.multimedia.backend.dto.appointment.AppointmentRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.ReferralSource;
import taller.multimedia.backend.repository.appointment.AppointmentRepository;
import taller.multimedia.backend.service.EmailService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private ScheduleConfigService scheduleConfigService;

    @Mock
    private CalendarSyncAsyncService calendarSyncAsyncService;

    private AppointmentService appointmentService;

    @BeforeEach
    void setUp() {
        appointmentService = new AppointmentService(calendarSyncAsyncService);
        ReflectionTestUtils.setField(appointmentService, "appointmentRepository", appointmentRepository);
        ReflectionTestUtils.setField(appointmentService, "emailService", emailService);
        ReflectionTestUtils.setField(appointmentService, "scheduleConfigService", scheduleConfigService);
    }

    private AppointmentRequest validRequest() {
        LocalDateTime nextAvailableWeekday = nextWeekdayAt(10, 0);

        AppointmentRequest request = new AppointmentRequest();
        request.setIdType("Costarricense");
        request.setParentIdentification("123456789");
        request.setParentName("Ana Pérez");
        request.setParentEmail("ana@gmail.com");
        request.setParentPhone("+50688887777");
        request.setParentOccupation("Ingeniera");
        request.setChildName("Pedrito");
        request.setAppointmentDate(nextAvailableWeekday);
        request.setParentNotes("Ninguna");
        request.setReferralSource(ReferralSource.FRIEND);
        request.setLanguage("es");

        lenient().when(scheduleConfigService.getAvailableSlotsForDate(any()))
                .thenReturn(List.of(nextAvailableWeekday.toLocalTime()));
        lenient().when(appointmentRepository.findByAppointmentDateBetween(any(), any())).thenReturn(List.of());

        return request;
    }

    private static LocalDateTime nextWeekdayAt(int hour, int minute) {
        LocalDate date = LocalDate.now().plusDays(1);
        while (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
            date = date.plusDays(1);
        }
        return date.atTime(LocalTime.of(hour, minute));
    }

    @ParameterizedTest
    @ValueSource(strings = { "parentName", "parentOccupation", "childName", "parentNotes" })
    void createAppointment_rejectsMaliciousFreeTextFieldsAndNeverSaves(String field) {
        AppointmentRequest request = validRequest();
        String maliciousValue = "<script>alert(1)</script>x";

        switch (field) {
            case "parentName" -> request.setParentName(maliciousValue);
            case "parentOccupation" -> request.setParentOccupation(maliciousValue);
            case "childName" -> request.setChildName(maliciousValue);
            case "parentNotes" -> request.setParentNotes(maliciousValue);
            default -> throw new IllegalStateException("Campo no cubierto: " + field);
        }

        assertThrows(InvalidFieldException.class, () -> appointmentService.createAppointment(request));

        verify(appointmentRepository, never()).save(any());
        verify(calendarSyncAsyncService, never()).addAppointmentAsync(any());
        verify(emailService, never()).sendAppointmentPendingEmail(any(), any());
    }

    @Test
    void createAppointment_rejectsAMaliciousEmailAndNeverSaves() {
        AppointmentRequest request = validRequest();
        request.setParentEmail("<script>x</script>ana@gmail.com");

        assertThrows(InvalidFieldException.class, () -> appointmentService.createAppointment(request));

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void createAppointment_keepsTheLineBreaksInParentNotes() {
        String multilineNotes = "Primer detalle.\n\nSegundo detalle importante.";
        AppointmentRequest request = validRequest();
        request.setParentNotes(multilineNotes);

        when(appointmentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        appointmentService.createAppointment(request);

        ArgumentCaptor<Appointment> savedAppointment = ArgumentCaptor.forClass(Appointment.class);
        verify(appointmentRepository).save(savedAppointment.capture());
        assertThat(savedAppointment.getValue().getParentNotes()).isEqualTo(multilineNotes);
    }
}
