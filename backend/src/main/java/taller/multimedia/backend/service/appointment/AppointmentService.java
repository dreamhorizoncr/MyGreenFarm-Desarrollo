package taller.multimedia.backend.service.appointment;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import org.springframework.beans.factory.annotation.Value;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import taller.multimedia.backend.dto.appointment.AppointmentRequest;
import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.repository.appointment.AppointmentRepository;
import taller.multimedia.backend.service.EmailService;

@Slf4j 
@Service
public class AppointmentService {

    private static final Set<String> IDIOMAS_VALIDOS = Set.of("es", "en", "fr");

    private final CalendarSyncAsyncService calendarSyncAsyncService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private EmailService emailService;

    @Value("${daycare.mail.admin}") // Correo de la administración para avisarle de nuevas solicitudes
    private String correoAdmin;

    AppointmentService(CalendarSyncAsyncService calendarSyncAsyncService) {
        this.calendarSyncAsyncService = calendarSyncAsyncService;
    }

    @Transactional
    public Appointment createAppointment(AppointmentRequest dto) {
        LocalDateTime requestedStart = dto.getAppointmentDate();
        LocalDateTime requestedEnd = requestedStart.plusMinutes(59); // Duración de la cita

        validateParentIdentification(dto.getIdType(), dto.getParentIdentification());

        String formattedPhone = parseAndValidatePhone(dto.getParentPhone());

        List<Appointment> conflictingAppointments = appointmentRepository.findByAppointmentDateBetween(
                requestedStart.minusMinutes(59), // Margen para evitar solapamientos
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
        String langCode = resolverLangCode(dto.getLanguage());
        appointment.setLanguage(langCode);
        appointment.setAppointmentDate(dto.getAppointmentDate());
        appointment.setParentNotes(dto.getParentNotes());

        // Nace obligatoriamente en PENDING
        appointment.setStatus(AppointmentStatus.PENDING);
        long start = System.currentTimeMillis();
        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("Guardar cita tardó: {} ms", System.currentTimeMillis() - start);
        appointmentRepository.flush();

        calendarSyncAsyncService.addAppointmentAsync(savedAppointment.getId());

        log.info("Idioma recibido del DTO: '{}', langCode resuelto: '{}'", dto.getLanguage(), langCode);
        Locale locale = Locale.forLanguageTag(langCode);

        emailService.sendAppointmentPendingEmail(savedAppointment, locale);
        emailService.sendAdminNewAppointmentAlert(savedAppointment);
        return savedAppointment;
    }

  //se cambió esto 
    private String resolverLangCode(String languageFromDto) {
    if (languageFromDto == null || languageFromDto.isBlank()) {
        log.warn("El idioma recibido es nulo o vacío. Usando por defecto: 'es'");
        return "es";
    }

    String normalizado = languageFromDto.toLowerCase().trim();
    
    if (normalizado.contains("fr")) return "fr";
    if (normalizado.contains("en")) return "en";
    if (normalizado.contains("es")) return "es";

    log.warn("Idioma no reconocido '{}'. Usando por defecto: 'es'", languageFromDto);
    return "es";
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
    public Appointment updateAppointmentStatus(
            UUID id,
            AppointmentStatus newStatus,
            String teacherConclusion,
            String lang) {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada con ID: " + id));

        AppointmentStatus previousStatus = appointment.getStatus();
        appointment.setStatus(newStatus);

        if (teacherConclusion != null && !teacherConclusion.isBlank()) {
            appointment.setTeacherConclusion(teacherConclusion);
        }

        Appointment updatedAppointment = appointmentRepository.save(appointment);

        if (newStatus == AppointmentStatus.CONFIRMED
                || newStatus == AppointmentStatus.CANCELLED) {

            calendarSyncAsyncService.updateAppointmentStatusAsync(
                    updatedAppointment.getId(),
                    newStatus);
        }

        if (previousStatus != newStatus) {
            String languageCode = appointment.getLanguage() != null
                    ? appointment.getLanguage()
                    : (lang != null ? lang : "es");

            Locale locale = Locale.forLanguageTag(languageCode);

            emailService.sendAppointmentStatusUpdateEmail(
                    updatedAppointment,
                    locale);

            if (newStatus == AppointmentStatus.CONFIRMED) {
                emailService.sendAdminConfirmedAppointmentAlert(updatedAppointment);
            } else if (newStatus == AppointmentStatus.CANCELLED) {
                emailService.sendAdminCancelledAppointmentAlert(updatedAppointment);
            }
        }

        return updatedAppointment;
    }

    @Transactional
    public Appointment rescheduleAppointment(
            UUID id,
            LocalDateTime newAppointmentDate,
            String lang) {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException(
                    "No se puede reprogramar una cita cancelada.");
        }

        LocalDateTime newEnd = newAppointmentDate.plusMinutes(59);

        List<Appointment> conflictingAppointments = appointmentRepository.findByAppointmentDateBetween(
                newAppointmentDate.minusMinutes(29),
                newEnd);

        boolean isSlotTaken = conflictingAppointments.stream()
                .anyMatch(other -> !other.getId().equals(id)
                        && (other.getStatus() == AppointmentStatus.PENDING
                                || other.getStatus() == AppointmentStatus.CONFIRMED));

        if (isSlotTaken) {
            throw new RuntimeException(
                    "El nuevo horario seleccionado ya está ocupado.");
        }

        appointment.setAppointmentDate(newAppointmentDate);

        if (appointment.getStatus() == AppointmentStatus.PENDING) {
            appointment.setStatus(AppointmentStatus.CONFIRMED);
        }

        Appointment savedAppointment = appointmentRepository.save(appointment);

        calendarSyncAsyncService.rescheduleAppointmentAsync(
                savedAppointment.getId(),
                newAppointmentDate);

        String languageCode = appointment.getLanguage() != null
                ? appointment.getLanguage()
                : (lang != null ? lang : "es");

        Locale locale = Locale.forLanguageTag(languageCode);

        emailService.sendRescheduleEmail(savedAppointment, locale);

        return savedAppointment;
    }

    // Se ejecuta cada hora para revisar citas a 24 horas de distancia
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void send24HourReminders() {
        LocalDateTime now = LocalDateTime.now();

        LocalDateTime targetStart = now.plusHours(24);
        LocalDateTime targetEnd = now.plusHours(25);

        List<Appointment> upcomingAppointments = appointmentRepository.findByAppointmentDateBetweenAndStatus(
                targetStart, targetEnd, AppointmentStatus.CONFIRMED);

        for (Appointment appointment : upcomingAppointments) {
            try {
                String langCode = appointment.getLanguage() != null ? appointment.getLanguage() : "es";
                Locale locale = Locale.forLanguageTag(langCode);


                emailService.sendAppointmentReminderEmail(appointment, locale);

                appointment.setReminderSent(true);
                appointmentRepository.save(appointment);


                System.out.println("Correo de recordatorio enviado para la cita ID: " + appointment.getId());
            } catch (Exception e) {
                System.err.println(
                        "Error al enviar recordatorio para la cita " + appointment.getId() + ": " + e.getMessage());
                System.err.println(
                        "Error al enviar recordatorio para la cita " + appointment.getId() + ": " + e.getMessage());
            }
        }
    }
}
