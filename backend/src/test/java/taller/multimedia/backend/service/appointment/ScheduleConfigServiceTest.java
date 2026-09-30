package taller.multimedia.backend.service.appointment;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.appointment.ScheduleException;
import taller.multimedia.backend.repository.appointment.AppointmentRepository;
import taller.multimedia.backend.repository.appointment.ScheduleExceptionRepository;
import taller.multimedia.backend.repository.appointment.WeeklyScheduleRepository;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ScheduleConfigServiceTest {

    @Mock
    private WeeklyScheduleRepository weeklyRepo;

    @Mock
    private ScheduleExceptionRepository exceptionRepo;

    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private ScheduleConfigService scheduleConfigService;

    @Test
    void saveException_rejectsAMaliciousReasonAndNeverSaves() {
        ScheduleException exception = new ScheduleException();
        exception.setExceptionDate(LocalDate.now().plusDays(1));
        exception.setClosed(true);
        exception.setReason("<script>alert(1)</script>Cerrado por feriado");

        assertThrows(InvalidFieldException.class, () -> scheduleConfigService.saveException(exception));

        verify(exceptionRepo, never()).save(any());
    }

    @Test
    void saveException_allowsANullReason() {
        ScheduleException exception = new ScheduleException();
        exception.setExceptionDate(LocalDate.now().plusDays(1));
        exception.setClosed(true);

        scheduleConfigService.saveException(exception);

        verify(exceptionRepo).save(exception);
    }
}
