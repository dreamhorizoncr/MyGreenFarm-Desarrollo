package taller.multimedia.backend.service.appointment;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.api.client.util.Value;

import jakarta.transaction.Transactional;
import taller.multimedia.backend.dto.appointment.AppointmentRequest;
import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.repository.appointment.AppointmentRepository;
import taller.multimedia.backend.service.EmailService;

@Service
public class AppointmentService {

    private final GoogleCalendarService googleCalendarService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private EmailService emailService;

    @Value("${daycare.mail.admin}") // Correo de la administración para avisarle de nuevas solicitudes
    private String correoAdmin;

    AppointmentService(GoogleCalendarService googleCalendarService) {
        this.googleCalendarService = googleCalendarService;
    }

    @Transactional
    public Appointment createAppointment(AppointmentRequest dto) {
        LocalDateTime requestedStart = dto.getAppointmentDate();
        LocalDateTime requestedEnd = requestedStart.plusMinutes(60); // Duración de la cita

        validateParentIdentification(dto.getIdType(), dto.getParentIdentification());

        String formattedPhone = parseAndValidatePhone(dto.getParentPhone());

        List<Appointment> conflictingAppointments = appointmentRepository.findByAppointmentDateBetween(
                requestedStart.minusMinutes(60), // Margen para evitar solapamientos
                requestedEnd);

        boolean isSlotTaken = conflictingAppointments.stream()
            .anyMatch(a -> a.getStatus() != AppointmentStatus.CANCELLED);

        if (isSlotTaken) {
            throw new RuntimeException(
                    "Lo sentimos, este horario ya ha sido reservado o está pendiente de aprobación.");
        }

        Appointment appointment = new Appointment();
        appointment.setParentIdentification(dto.getParentIdentification());
        appointment.setParentName(dto.getParentName());
        appointment.setParentEmail(dto.getParentEmail());
        appointment.setParentPhone(formattedPhone);
        appointment.setParentOccupation(dto.getParentOccupation());
        appointment.setChildName(dto.getChildName());
        appointment.setAppointmentDate(dto.getAppointmentDate());
        appointment.setParentNotes(dto.getParentNotes());

        // Nace obligatoriamente en PENDING
        appointment.setStatus(AppointmentStatus.PENDING);
        Appointment savedAppointment = appointmentRepository.save(appointment);

        googleCalendarService.addAppointmentToCalendar(savedAppointment);

        Locale locale = (dto.getLanguage() != null) ? Locale.forLanguageTag(dto.getLanguage()) : new Locale("es");

        emailService.sendAppointmentPendingEmail(savedAppointment, locale);

        emailService.sendAdminNewAppointmentAlert(savedAppointment);

        return savedAppointment;
    }

    private void validateParentIdentification(String idType, String parentIdentification) {
        if (parentIdentification == null || parentIdentification.trim().isEmpty()) {
            throw new IllegalArgumentException("La identificación no puede estar vacía.");
        }

        if ("Costarricense".equalsIgnoreCase(idType)) {
            if (!parentIdentification.matches("^\\d{9,10}$")) {
                throw new IllegalArgumentException("El formato de la cédula costarricense no es válido.");
            }
        } else if ("Extranjero".equalsIgnoreCase(idType)) {
            if (!parentIdentification.matches("^[A-Za-z0-9-]{6,20}$")) {
                throw new IllegalArgumentException("El formato de la identificación extranjera no es válido.");
            }
        } else {
            throw new IllegalArgumentException("Debe seleccionar un tipo de identificación válido.");
        }
    }

    private String parseAndValidatePhone(String fullPhoneNumber) {
        if (fullPhoneNumber == null || fullPhoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("El número de teléfono no puede estar vacío.");
        }

        // Limpia espacios y guiones para hacer la validación uniforme
        String cleanedPhone = fullPhoneNumber.trim().replaceAll("[\\s-]", "");

        if (!cleanedPhone.startsWith("+")) {
            throw new IllegalArgumentException(
                    "El número de teléfono debe incluir el prefijo internacional (ej. +506...).");
        }

        // Expresión regular para separar el prefijo (grupo 1) y el número local (grupo
        // 2)
        Pattern pattern = java.util.regex.Pattern.compile("^(\\+\\d{1,3})(\\d{7,12})$");
        Matcher matcher = pattern.matcher(cleanedPhone);

        if (!matcher.matches()) {
            throw new IllegalArgumentException("El formato del número de teléfono no es válido.");
        }

        // Retorna ambos fragmentos unidos explícitamente con un espacio intermedio
        return matcher.group(1) + " " + matcher.group(2);
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public Appointment getAppointmentById(UUID id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada con el ID: " + id));
    }

    @Transactional
    public Appointment updateAppointmentStatus(UUID id, AppointmentStatus newStatus, String teacherConclusion,
            String lang) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada con ID: " + id));

        AppointmentStatus previous = appointment.getStatus();
        appointment.setStatus(newStatus);

        if (teacherConclusion != null && !teacherConclusion.isBlank()) {
            appointment.setTeacherConclusion(teacherConclusion);
        }

        if (newStatus == AppointmentStatus.CONFIRMED) {
            googleCalendarService.updateAppointmentInCalendar(appointment, "Cita Confirmada: ");
            emailService.sendAdminConfirmedAppointmentAlert(appointment);
        } else if (newStatus == AppointmentStatus.CANCELLED || newStatus == AppointmentStatus.CANCELLED) {
            googleCalendarService.removeAppointmentFromCalendar(appointment);
            emailService.sendAdminCancelledAppointmentAlert(appointment);
        }

        Appointment updated = appointmentRepository.save(appointment);

        if (previous != newStatus) {
            Locale locale = (lang != null) ? Locale.forLanguageTag(lang) : new Locale("es");
            emailService.sendAppointmentStatusUpdateEmail(updated, locale);
        }

        return updated;
    }

    @Transactional
    public Appointment rescheduleAppointment(UUID id, LocalDateTime newAppointmentDate, String lang) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException("No se puede reprogramar una cita que se encuentra cancelada.");
        }

        LocalDateTime newStart = newAppointmentDate;
        LocalDateTime newEnd = newStart.plusMinutes(60);

        List<Appointment> conflictingAppointments = appointmentRepository.findByAppointmentDateBetween(
                newStart.minusMinutes(29),
                newEnd);

        boolean isSlotTaken = conflictingAppointments.stream()
                .anyMatch(a -> !a.getId().equals(id) &&
                        (a.getStatus() == AppointmentStatus.PENDING ||
                                a.getStatus() == AppointmentStatus.CONFIRMED));

        if (isSlotTaken) {
            throw new RuntimeException("El nuevo horario seleccionado ya está ocupado por otra cita.");
        }

        appointment.setAppointmentDate(newStart);

        if (appointment.getStatus() == AppointmentStatus.PENDING) {
            appointment.setStatus(AppointmentStatus.CONFIRMED);
        }

        Appointment savedAppointment = appointmentRepository.save(appointment);

        googleCalendarService.rescheduleAppointmentInCalendar(savedAppointment, newStart);

        Locale locale = (lang != null) ? Locale.forLanguageTag(lang) : new Locale("es");
        emailService.sendRescheduleEmail(savedAppointment, locale);

        return savedAppointment;
    }
}
