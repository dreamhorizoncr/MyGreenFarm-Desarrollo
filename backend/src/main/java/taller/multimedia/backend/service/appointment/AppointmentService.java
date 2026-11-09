package taller.multimedia.backend.service.appointment;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import taller.multimedia.backend.dto.appointment.AppointmentRequest;
import taller.multimedia.backend.dto.appointment.AppointmentResponse;
import taller.multimedia.backend.exception.SlotUnavailableException;
import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.model.appointment.ReferralSource;
import taller.multimedia.backend.repository.appointment.AppointmentRepository;
import taller.multimedia.backend.service.EmailService;
import taller.multimedia.backend.util.Sanitizer;

@Slf4j
@Service
public class AppointmentService {

    private final CalendarSyncAsyncService calendarSyncAsyncService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ScheduleConfigService scheduleConfigService;

    @Value("${daycare.mail.admin}")
    private String adminEmail;

    AppointmentService(CalendarSyncAsyncService calendarSyncAsyncService) {
        this.calendarSyncAsyncService = calendarSyncAsyncService;
    }

    @Transactional
    public Appointment createAppointment(AppointmentRequest dto) {
        LocalDateTime requestedStart = dto.getAppointmentDate();
        LocalDate requestedDate = requestedStart.toLocalDate();

        LocalTime requestedTime = requestedStart.toLocalTime();

        LocalDate today = LocalDate.now();

        if (!requestedDate.isAfter(today)) {
            throw new RuntimeException(
                    "Appointments cannot be booked for the same day or past dates. Book at least one day in advance.");
        }

        if (requestedDate.getDayOfWeek().getValue() >= 6) {
            throw new RuntimeException("The daycare is closed on weekends.");
        }

        List<LocalTime> availableSlots = scheduleConfigService.getAvailableSlotsForDate(requestedStart.toLocalDate());

        if (!availableSlots.contains(requestedTime)) {
            throw new SlotUnavailableException(
                    "Sorry, the selected time slot is no longer available. Choose another time slot.");
        }

        LocalDateTime requestedEnd = requestedStart.plusMinutes(59);

        validateParentIdentification(dto.getIdType(), dto.getParentIdentification());

        String parentEmail = Sanitizer.requireClean("parentEmail", dto.getParentEmail());
        validateAllowedEmail(parentEmail);

        String parentName = Sanitizer.requireClean("parentName", dto.getParentName());
        String parentOccupation = Sanitizer.requireClean("parentOccupation", dto.getParentOccupation());
        String childName = Sanitizer.requireClean("childName", dto.getChildName());
        String parentNotes = Sanitizer.requireCleanPreserveLineBreaks("parentNotes", dto.getParentNotes());
        String referralOtherDetail = dto.getReferralOtherDetail() == null
                ? null
                : Sanitizer.requireClean("referralOtherDetail", dto.getReferralOtherDetail());

        String formattedPhone = parseAndValidatePhone(dto.getParentPhone());

        List<Appointment> conflictingAppointments = appointmentRepository.findByAppointmentDateBetween(
                requestedStart.minusMinutes(59),
                requestedEnd);

        boolean isSlotTaken = conflictingAppointments.stream()
                .anyMatch(a -> a.getStatus() != AppointmentStatus.CANCELLED);

        if (isSlotTaken) {
            throw new SlotUnavailableException(
                    "Sorry, this time slot is already booked or pending approval.");
        }

        Appointment appointment = new Appointment();
        appointment.setParentIdentification(dto.getParentIdentification());
        appointment.setParentName(parentName);
        appointment.setParentEmail(parentEmail);
        appointment.setParentPhone(formattedPhone);
        appointment.setParentOccupation(parentOccupation);
        appointment.setReferralSource(dto.getReferralSource());
        if (dto.getReferralSource() == ReferralSource.OTHER) {
            if (referralOtherDetail == null || referralOtherDetail.isBlank()) {
                throw new IllegalArgumentException("Tell us how you heard about us.");
            }
            appointment.setReferralOtherDetail(referralOtherDetail);
        }
        appointment.setChildName(childName);
        String langCode = resolverLangCode(dto.getLanguage());
        appointment.setLanguage(langCode);
        appointment.setAppointmentDate(dto.getAppointmentDate());
        appointment.setParentNotes(parentNotes);

        appointment.setStatus(AppointmentStatus.PENDING);
        long start = System.currentTimeMillis();
        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("Saving the appointment took {} ms", System.currentTimeMillis() - start);
        appointmentRepository.flush();

        calendarSyncAsyncService.addAppointmentAsync(savedAppointment.getId());

        Locale locale = Locale.forLanguageTag(langCode);

        emailService.sendAppointmentPendingEmail(savedAppointment, locale);
        emailService.sendAdminNewAppointmentAlert(savedAppointment);
        return savedAppointment;
    }

    private void validateAllowedEmail(String email) {
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("The email is not valid.");
        }

        List<String> allowedDomains = List.of(
                "gmail.com",
                "hotmail.com",
                "outlook.com");

        String domain = email.substring(email.indexOf("@") + 1).toLowerCase().trim();

        if (!allowedDomains.contains(domain)) {
            throw new IllegalArgumentException(
                    "Please use a Gmail, Hotmail or Outlook email address.");
        }
    }

    private String resolverLangCode(String languageFromDto) {
        if (languageFromDto == null || languageFromDto.isBlank()) {
            log.warn("The received language is null or empty. Defaulting to 'es'");
            return "es";
        }

        String normalizado = languageFromDto.toLowerCase().trim();

        if (normalizado.contains("fr"))
            return "fr";
        if (normalizado.contains("en"))
            return "en";
        if (normalizado.contains("es"))
            return "es";

        log.warn("Unrecognized language '{}'. Defaulting to 'es'", languageFromDto);
        return "es";
    }

    private void validateParentIdentification(String idType, String parentIdentification) {
        if (parentIdentification == null || parentIdentification.trim().isEmpty()) {
            throw new IllegalArgumentException("The ID number cannot be empty.");
        }

        if ("Costarricense".equalsIgnoreCase(idType)) {
            if (!parentIdentification.matches("^\\d{9,10}$")) {
                throw new IllegalArgumentException("The Costa Rican ID number format is not valid.");
            }
        } else if ("Extranjero".equalsIgnoreCase(idType)) {
            if (!parentIdentification.matches("^[A-Za-z0-9-]{6,20}$")) {
                throw new IllegalArgumentException("The foreign ID number format is not valid.");
            }
        } else {
            throw new IllegalArgumentException("You must select a valid ID type.");
        }
    }

    private String parseAndValidatePhone(String fullPhoneNumber) {
        if (fullPhoneNumber == null || fullPhoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("The phone number cannot be empty.");
        }

        String cleanedPhone = fullPhoneNumber.trim().replaceAll("[\\s-]", "");

        if (!cleanedPhone.startsWith("+")) {
            throw new IllegalArgumentException(
                    "The phone number must include the country code (e.g. +506...).");
        }

        Pattern pattern = java.util.regex.Pattern.compile("^(\\+\\d{1,3})(\\d{7,12})$");
        Matcher matcher = pattern.matcher(cleanedPhone);

        if (!matcher.matches()) {
            throw new IllegalArgumentException("The phone number format is not valid.");
        }

        return matcher.group(1) + " " + matcher.group(2);
    }

    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getAppointments(
            AppointmentStatus status,
            LocalDate date,
            String search,
            boolean excludePast,
            LocalDateTime notBefore,
            Pageable pageable) {
        Specification<Appointment> specification = (root, query, criteriaBuilder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (excludePast) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("appointmentDate"),
                        notBefore == null ? LocalDateTime.now() : notBefore));
            }
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (date != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("appointmentDate"), date.atStartOfDay()));
                predicates.add(criteriaBuilder.lessThan(
                        root.get("appointmentDate"), date.plusDays(1).atStartOfDay()));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("childName")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("parentName")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("parentEmail")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("parentPhone")), pattern)));
            }
            return criteriaBuilder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        Pageable stablePageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Order.asc("appointmentDate"), Sort.Order.asc("id")));
        return appointmentRepository.findAll(specification, stablePageable).map(AppointmentResponse::from);
    }

    public Appointment getAppointmentById(UUID id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with the ID: " + id));
    }

    @Transactional
    public Appointment updateAppointmentStatus(
            UUID id,
            AppointmentStatus newStatus,
            String teacherConclusion,
            String lang) {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));

        AppointmentStatus previousStatus = appointment.getStatus();
        appointment.setStatus(newStatus);

        if (teacherConclusion != null && !teacherConclusion.isBlank()) {
            appointment.setTeacherConclusion(
                    Sanitizer.requireCleanPreserveLineBreaks("teacherConclusion", teacherConclusion));
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

        LocalDate requestedDate = newAppointmentDate.toLocalDate();
        LocalDate today = LocalDate.now();

        if (!requestedDate.isAfter(today)) {
            throw new RuntimeException("An appointment cannot be rescheduled for the same day or past dates.");
        }

        if (requestedDate.getDayOfWeek().getValue() >= 6) {
            throw new RuntimeException("The daycare is closed on weekends.");
        }

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException(
                    "A cancelled appointment cannot be rescheduled.");
        }

        List<LocalTime> availableSlots = scheduleConfigService
                .getAvailableSlotsForDate(newAppointmentDate.toLocalDate());
        LocalTime newTime = newAppointmentDate.toLocalTime();

        if (!availableSlots.contains(newTime)) {
            throw new SlotUnavailableException(
                    "Sorry, the new selected time slot is not available.");
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
            throw new SlotUnavailableException(
                    "The new selected time slot is already taken.");
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

                System.out.println("Reminder email sent for appointment ID: " + appointment.getId());
            } catch (Exception e) {
                System.err.println(
                        "Error sending the reminder for appointment " + appointment.getId() + ": " + e.getMessage());
            }
        }
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void autoCancelExpiredPendingAppointments() {
        LocalDateTime now = LocalDateTime.now();
        
        List<Appointment> expiredAppointments = appointmentRepository.findByAppointmentDateBeforeAndStatus(
                now, AppointmentStatus.PENDING);

        for (Appointment appointment : expiredAppointments) {
            try {
                appointment.setStatus(AppointmentStatus.CANCELLED);
                Appointment savedAppointment = appointmentRepository.save(appointment);
                
                log.info("Pending appointment ID: {} automatically cancelled because its date passed.", savedAppointment.getId());

                calendarSyncAsyncService.updateAppointmentStatusAsync(
                        savedAppointment.getId(),
                        AppointmentStatus.CANCELLED);

                String languageCode = savedAppointment.getLanguage() != null ? savedAppointment.getLanguage() : "es";
                Locale locale = Locale.forLanguageTag(languageCode);

                emailService.sendAppointmentStatusUpdateEmail(savedAppointment, locale);
                emailService.sendAdminCancelledAppointmentAlert(savedAppointment);

            } catch (Exception e) {
                log.error("Error automatically cancelling appointment {}: {}", appointment.getId(), e.getMessage());
            }
        }
    }

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void deleteOldCancelledAppointments() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        List<Appointment> oldCancelledAppointments = appointmentRepository.findByStatusAndAppointmentDateBefore(
                AppointmentStatus.CANCELLED, thirtyDaysAgo);

        if (oldCancelledAppointments.isEmpty()) {
            return;
        }

        for (Appointment appointment : oldCancelledAppointments) {
            try {
                appointmentRepository.delete(appointment);
                
                log.info("Cancelled appointment ID: {} permanently deleted from the database after 30 days.", appointment.getId());

            } catch (Exception e) {
                log.error("Error deleting cancelled appointment {}: {}", appointment.getId(), e.getMessage());
            }
        }
    }
}
