package taller.multimedia.backend.service.appointment;

import java.time.LocalDateTime;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.appointment.AppointmentRepository;
import taller.multimedia.backend.repository.user.UserRepository;

@Service
public class CalendarSyncAsyncService {

    private static final Logger log =
            LoggerFactory.getLogger(CalendarSyncAsyncService.class);

    private final GoogleCalendarService googleCalendarService;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    public CalendarSyncAsyncService(
            GoogleCalendarService googleCalendarService,
            AppointmentRepository appointmentRepository,
            UserRepository userRepository) {
        this.googleCalendarService = googleCalendarService;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
    }

    @Async("taskExecutor")
    @Transactional
    public void addAppointmentAsync(UUID appointmentId) {
        try {
            Appointment appointment = appointmentRepository.findById(appointmentId)
                    .orElseThrow(() ->
                            new RuntimeException("Cita no encontrada: " + appointmentId));

            googleCalendarService.addAppointmentToCalendar(appointment);
            appointmentRepository.save(appointment);

            log.info("Cita {} sincronizada con Google Calendar", appointmentId);
        } catch (Exception e) {
            log.error(
                    "Error sincronizando la cita {} con Google Calendar",
                    appointmentId,
                    e);
        }
    }

    @Async("taskExecutor")
    @Transactional
    public void updateAppointmentStatusAsync(
            UUID appointmentId,
            AppointmentStatus status) {

        try {
            Appointment appointment = appointmentRepository.findById(appointmentId)
                    .orElseThrow(() ->
                            new RuntimeException("Cita no encontrada: " + appointmentId));

            if (status == AppointmentStatus.CONFIRMED) {
                googleCalendarService.updateAppointmentInCalendar(
                        appointment,
                        "Cita Confirmada: ");
            } else if (status == AppointmentStatus.CANCELLED) {
                googleCalendarService.removeAppointmentFromCalendar(appointment);
            }

            log.info(
                    "Estado de la cita {} sincronizado con Google Calendar",
                    appointmentId);
        } catch (Exception e) {
            log.error(
                    "Error actualizando la cita {} en Google Calendar",
                    appointmentId,
                    e);
        }
    }

    @Async("taskExecutor")
    @Transactional
    public void rescheduleAppointmentAsync(
            UUID appointmentId,
            LocalDateTime newDate) {

        try {
            Appointment appointment = appointmentRepository.findById(appointmentId)
                    .orElseThrow(() ->
                            new RuntimeException("Cita no encontrada: " + appointmentId));

            googleCalendarService.rescheduleAppointmentInCalendar(
                    appointment,
                    newDate);

            log.info(
                    "Cita {} reprogramada en Google Calendar",
                    appointmentId);
        } catch (Exception e) {
            log.error(
                    "Error reprogramando la cita {} en Google Calendar",
                    appointmentId,
                    e);
        }
    }

    @Async
@Transactional
public void syncBirthdayAsync(UUID userId) {
    User user = userRepository.findById(userId).orElse(null);
    if (user == null) return;

    try {
        boolean shouldHaveEvent = user.getRole() == Role.TEACHER && user.getBirthday() != null;

        if (!shouldHaveEvent) {
            if (user.getBirthdayEventId() != null) {
                googleCalendarService.deleteBirthdayEvent(user.getBirthdayEventId());
                user.setBirthdayEventId(null);
            }
        } else if (user.getBirthdayEventId() == null) {
            user.setBirthdayEventId(googleCalendarService.createBirthdayEvent(user));
        } else {
            googleCalendarService.updateBirthdayEvent(user);
        }
    } catch (Exception e) {
        log.error("No se pudo sincronizar el cumpleaños del usuario {}", userId, e);
    }
}
}