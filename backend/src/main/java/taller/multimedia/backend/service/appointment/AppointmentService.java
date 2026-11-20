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
import taller.multimedia.backend.service.email.EmailService;
import taller.multimedia.backend.util.Sanitizer;
import taller.multimedia.backend.util.AfterCommit;

/**
 * Visit appointments that families book through the site, and their life cycle: pending, confirmed
 * or cancelled.
 *
 * <p>Appointments last one hour, are booked at least one day in advance on weekdays, and must match
 * a free slot of the schedule. Changes are emailed to the family and to the administration, and
 * synced to Google Calendar in the background. Hourly jobs send 24-hour reminders and cancel
 * pending appointments whose date passed; a nightly job deletes cancelled appointments older than
 * 30 days.
 */
@Slf4j
@Service
public class AppointmentService {

    private final CalendarSyncAsyncService calendarSyncAsyncService;

    private final AppointmentRepository appointmentRepository;

    private final EmailService emailService;

    private final ScheduleConfigService scheduleConfigService;

    @Value("${daycare.mail.admin}")
    private String adminEmail;

    /**
     * @param calendarSyncAsyncService syncs appointments with Google Calendar
     * @param appointmentRepository appointment storage
     * @param emailService sends the emails to families and administration
     * @param scheduleConfigService tells which slots are free
     */
    AppointmentService(CalendarSyncAsyncService calendarSyncAsyncService, AppointmentRepository appointmentRepository,
            EmailService emailService, ScheduleConfigService scheduleConfigService) {
        this.calendarSyncAsyncService = calendarSyncAsyncService;
        this.appointmentRepository = appointmentRepository;
        this.emailService = emailService;
        this.scheduleConfigService = scheduleConfigService;
    }

    /**
     * Books a pending appointment, emails the family and the administration, and adds it to Google
     * Calendar after the transaction commits.
     *
     * @param request family's data, the slot and the language
     * @return the saved appointment
     * @throws RuntimeException if the date is today, in the past or on a weekend
     * @throws SlotUnavailableException if the slot is not free or is already booked
     * @throws IllegalArgumentException if the ID number, email, phone or referral detail is not
     *     valid
     * @throws taller.multimedia.backend.exception.InvalidFieldException if a text is unsafe
     */
    @Transactional
    public Appointment createAppointment(AppointmentRequest request) {
        LocalDateTime requestedStart = request.getAppointmentDate();
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

        validateParentIdentification(request.getIdType(), request.getParentIdentification());

        String parentEmail = Sanitizer.requireClean("parentEmail", request.getParentEmail());
        validateAllowedEmail(parentEmail);

        String parentName = Sanitizer.requireClean("parentName", request.getParentName());
        String parentOccupation = Sanitizer.requireClean("parentOccupation", request.getParentOccupation());
        String childName = Sanitizer.requireClean("childName", request.getChildName());
        String parentNotes = Sanitizer.requireCleanPreserveLineBreaks("parentNotes", request.getParentNotes());
        String referralOtherDetail = request.getReferralOtherDetail() == null
                ? null
                : Sanitizer.requireClean("referralOtherDetail", request.getReferralOtherDetail());

        String formattedPhone = parseAndValidatePhone(request.getParentPhone());

        List<Appointment> conflictingAppointments = appointmentRepository.findByAppointmentDateBetween(
                requestedStart.minusMinutes(59),
                requestedEnd);

        boolean isSlotTaken = conflictingAppointments.stream()
                .anyMatch(appointment -> appointment.getStatus() != AppointmentStatus.CANCELLED);

        if (isSlotTaken) {
            throw new SlotUnavailableException(
                    "Sorry, this time slot is already booked or pending approval.");
        }

        Appointment appointment = new Appointment();
        appointment.setParentIdentification(request.getParentIdentification());
        appointment.setParentName(parentName);
        appointment.setParentEmail(parentEmail);
        appointment.setParentPhone(formattedPhone);
        appointment.setParentOccupation(parentOccupation);
        appointment.setReferralSource(request.getReferralSource());
        if (request.getReferralSource() == ReferralSource.OTHER) {
            if (referralOtherDetail == null || referralOtherDetail.isBlank()) {
                throw new IllegalArgumentException("Tell us how you heard about us.");
            }
            appointment.setReferralOtherDetail(referralOtherDetail);
        }
        appointment.setChildName(childName);
        String languageCode = resolveLanguageCode(request.getLanguage());
        appointment.setLanguage(languageCode);
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setParentNotes(parentNotes);

        appointment.setStatus(AppointmentStatus.PENDING);
        long start = System.currentTimeMillis();
        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("Saving the appointment took {} ms", System.currentTimeMillis() - start);
        appointmentRepository.flush();

        AfterCommit.run(() -> calendarSyncAsyncService.addAppointmentAsync(savedAppointment.getId()));

        Locale locale = Locale.forLanguageTag(languageCode);

        emailService.sendAppointmentPendingEmail(savedAppointment, locale);
        emailService.sendAdminNewAppointmentAlert(savedAppointment);
        return savedAppointment;
    }

    /**
     * @param email family's email
     * @throws IllegalArgumentException if it is not a Gmail, Hotmail or Outlook address
     */
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

    /**
     * @param requestedLanguage language sent by the booking form
     * @return {@code fr}, {@code en} or {@code es} (the default)
     */
    private String resolveLanguageCode(String requestedLanguage) {
        if (requestedLanguage == null || requestedLanguage.isBlank()) {
            log.warn("The received language is null or empty. Defaulting to 'es'");
            return "es";
        }

        String normalized = requestedLanguage.toLowerCase().trim();

        if (normalized.contains("fr"))
            return "fr";
        if (normalized.contains("en"))
            return "en";
        if (normalized.contains("es"))
            return "es";

        log.warn("Unrecognized language '{}'. Defaulting to 'es'", requestedLanguage);
        return "es";
    }

    /**
     * @param idType {@code Costarricense} (9 or 10 digits) or {@code Extranjero} (6 to 20 letters,
     *     digits or hyphens)
     * @param parentIdentification ID number
     * @throws IllegalArgumentException if the type is unknown or the number does not match it
     */
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

    /**
     * @param fullPhoneNumber phone with country code, for example {@code +506 8888-8888}
     * @return the phone as {@code +506 88888888}
     * @throws IllegalArgumentException if it is empty, has no country code or has the wrong length
     */
    private String parseAndValidatePhone(String fullPhoneNumber) {
        if (fullPhoneNumber == null || fullPhoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("The phone number cannot be empty.");
        }

        String cleanedPhone = fullPhoneNumber.trim().replaceAll("[\\s-]", "");

        if (!cleanedPhone.startsWith("+")) {
            throw new IllegalArgumentException(
                    "The phone number must include the country code (e.g. +506...).");
        }

        Pattern pattern = Pattern.compile("^(\\+\\d{1,3})(\\d{7,12})$");
        Matcher matcher = pattern.matcher(cleanedPhone);

        if (!matcher.matches()) {
            throw new IllegalArgumentException("The phone number format is not valid.");
        }

        return matcher.group(1) + " " + matcher.group(2);
    }

    /**
     * Searches appointments for the admin panel, sorted by date.
     *
     * @param status status to filter by, or {@code null} for all
     * @param date day to filter by, or {@code null}
     * @param search text to look for in the child's and parent's name, email and phone, or {@code
     *     null}
     * @param excludePast whether to hide appointments before {@code notBefore}
     * @param notBefore limit for past appointments, or {@code null} for now
     * @param pageable page and size; its sort is ignored
     * @return the matching appointments
     */
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

    /**
     * @param id appointment ID
     * @return the appointment
     * @throws RuntimeException if it does not exist
     */
    public Appointment getAppointmentById(UUID id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with the ID: " + id));
    }

    /**
     * Changes the status of an appointment. When it really changes, the family and the
     * administration are emailed; confirming or cancelling also updates Google Calendar.
     *
     * @param id appointment ID
     * @param newStatus new status
     * @param teacherConclusion notes after the visit, optional
     * @param lang language for the email when the appointment has none
     * @return the updated appointment
     * @throws RuntimeException if the appointment does not exist
     * @throws taller.multimedia.backend.exception.InvalidFieldException if the notes are unsafe
     */
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

    /**
     * Moves an appointment to another free slot. A pending appointment becomes confirmed. The
     * family is emailed and Google Calendar is updated.
     *
     * @param id appointment ID
     * @param newAppointmentDate new slot
     * @param lang language for the email when the appointment has none
     * @return the updated appointment
     * @throws RuntimeException if the date is today, in the past or on a weekend, or the
     *     appointment does not exist or was cancelled
     * @throws SlotUnavailableException if the new slot is not free
     */
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

    /**
     * Every hour, emails a reminder for the confirmed appointments that start between 24 and 25
     * hours from now. A failed email is logged and the rest are still sent.
     */
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
                String languageCode = appointment.getLanguage() != null ? appointment.getLanguage() : "es";
                Locale locale = Locale.forLanguageTag(languageCode);

                emailService.sendAppointmentReminderEmail(appointment, locale);

                appointment.setReminderSent(true);
                appointmentRepository.save(appointment);

                log.info("Reminder email sent for appointment ID: {}", appointment.getId());
            } catch (Exception e) {
                log.warn("Error sending the reminder for appointment {}: {}", appointment.getId(), e.getMessage());
            }
        }
    }

    /**
     * Every hour, cancels the pending appointments whose date already passed without being
     * confirmed, notifying the family, the administration and Google Calendar.
     */
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

    /**
     * Every night at midnight, deletes the cancelled appointments whose date is more than 30 days
     * old.
     */
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
