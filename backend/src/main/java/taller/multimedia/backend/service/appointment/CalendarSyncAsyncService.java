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
import taller.multimedia.backend.repository.appointment.AppointmentRepository;

@Service
public class CalendarSyncAsyncService {

    private static final Logger log =
            LoggerFactory.getLogger(CalendarSyncAsyncService.class);

    private final GoogleCalendarService googleCalendarService;
    private final AppointmentRepository appointmentRepository;

    public CalendarSyncAsyncService(
            GoogleCalendarService googleCalendarService,
            AppointmentRepository appointmentRepository) {
        this.googleCalendarService = googleCalendarService;
        this.appointmentRepository = appointmentRepository;
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
}