package taller.multimedia.backend.service;

import taller.multimedia.backend.dto.newsletter_subscriber.SubscriberInfo;
import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.model.curriculum.Curriculum;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.newsletter_subscriber.NewsletterSubscriberRepository;
import taller.multimedia.backend.repository.newsletter_subscriber.SubscriberEmailProjection;
import taller.multimedia.backend.service.translation.TranslationService;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final TemplateEngine templateEngine;
    private final MessageSource messageSource;
    private final BrevoEmailService brevoEmailService;
    private final NewsletterSubscriberRepository newsletterRepository;
    private final TranslationService translationService;

    @Value("${mail.support}")
    private String supportEmail;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${daycare.mail.admin}")
    private String correoAdmin;

    public EmailService(TemplateEngine templateEngine,
            MessageSource messageSource,
            BrevoEmailService brevoEmailService,
            NewsletterSubscriberRepository newsletterRepository,
            TranslationService translationService) {
        this.templateEngine = templateEngine;
        this.messageSource = messageSource;
        this.brevoEmailService = brevoEmailService;
        this.newsletterRepository = newsletterRepository;
        this.translationService = translationService;
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetLink = frontendUrl.replaceAll("/+$", "")
                + "/reset-password?token=" + resetToken;

        Context context = new Context();
        context.setVariable("resetLink", resetLink);
        context.setVariable("supportEmail", supportEmail);

        String html = templateEngine.process("email/auth/reset-password", context);

        sendEmail(toEmail, "Cambio de contraseña", html);
    }

    private void sendEmail(String toEmail, String subject, String html) {
        try {
            long start = System.currentTimeMillis();
            brevoEmailService.sendEmail(toEmail, toEmail, subject, html);
            log.info("Correo '{}' enviado a: {}", subject, toEmail);
            log.info("Enviar correo tardó: {} ms", System.currentTimeMillis() - start);
        } catch (IOException e) {
            log.error("Error enviando correo a {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("No se pudo enviar el correo", e);
        }
    }

    @Async
    public void sendAppointmentPendingEmail(Appointment appointment, Locale locale) {
        Context context = new Context(locale);
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("childName", appointment.getChildName());

        String fecha = appointment.getAppointmentDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        context.setVariable("appointmentDate", fecha);

        String html = templateEngine.process("email/appointments/appointment-pending", context);
        String subject = messageSource.getMessage("email.appointment.pending.subject", null, locale);

        sendEmail(appointment.getParentEmail(), subject, html);
    }

    @Async
    public void sendAppointmentStatusUpdateEmail(Appointment appointment, Locale locale) {
        Context context = new Context(locale);
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("childName", appointment.getChildName());
        context.setVariable("status", appointment.getStatus().name());

        String template = (appointment.getStatus() == AppointmentStatus.CONFIRMED)
                ? "email/appointments/appointment-confirmed"
                : "email/appointments/appointment-cancelled";

        String subjectKey = (appointment.getStatus() == AppointmentStatus.CONFIRMED)
                ? "email.appointment.confirmed.subject"
                : "email.appointment.cancelled.subject";

        String html = templateEngine.process(template, context);
        String subject = messageSource.getMessage(subjectKey, null, locale);

        sendEmail(appointment.getParentEmail(), subject, html);
    }

    @Async
    public void sendAdminNewAppointmentAlert(Appointment appointment) {
        String subject = "Nueva solicitud de cita pendiente";
        String body = String.format("El padre/madre %s solicitó una cita para el niño(a) %s.",
                appointment.getParentName(), appointment.getChildName());
        sendEmail(correoAdmin, subject, "<p>" + body + "</p>");
    }

    @Async
    public void sendAdminConfirmedAppointmentAlert(Appointment appointment) {
        String subject = "Cita confirmada";
        String body = String.format("El padre/madre %s que solicitó una cita para el niño(a) %s ha sido CONFIRMADA.",
                appointment.getParentName(), appointment.getChildName());
        sendEmail(correoAdmin, subject, "<p>" + body + "</p>");
    }

    @Async
    public void sendAdminCancelledAppointmentAlert(Appointment appointment) {
        String subject = "Cita cancelada";
        String body = String.format("El padre/madre %s que solicitó una cita para el niño(a) %s ha sido CANCELADA.",
                appointment.getParentName(), appointment.getChildName());
        sendEmail(correoAdmin, subject, "<p>" + body + "</p>");
    }

    @Async
    public void sendRescheduleEmail(Appointment appointment, Locale locale) {
        try {
            Context context = new Context(locale);
            context.setVariable("supportEmail", supportEmail);
            context.setVariable("childName", appointment.getChildName());

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            context.setVariable("appointmentDate", appointment.getAppointmentDate().format(formatter));

            String html = templateEngine.process("email/appointments/appointment-reschedule", context);

            String subject = messageSource.getMessage("email.appointment.reschedule.subject", null, locale);

            sendEmail(appointment.getParentEmail(), subject, html);

        } catch (Exception e) {
            log.error("Error al preparar el correo de reprogramación para {}: {}", appointment.getParentEmail(),
                    e.getMessage(), e);
            throw new RuntimeException("Error al enviar el correo de reprogramación", e);
        }
    }

    @Async
    public void sendApplicationReceivedEmail(Curriculum curriculum, String vacancyTitle, Locale locale) {
        Context context = new Context(locale);
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("applicantName", curriculum.getApplicantName());
        context.setVariable("vacancyTitle", vacancyTitle);

        String html = templateEngine.process("email/applications/application-received", context);
        String subject = messageSource.getMessage("email.application.received.subject", null, locale);

        sendEmail(curriculum.getApplicantEmail(), subject, html);
    }

    @Async
    public void sendApplicationHiredEmail(Curriculum curriculum, String vacancyTitle, Locale locale) {
        Context context = new Context(locale);
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("vacancyTitle", vacancyTitle);

        String html = templateEngine.process("email/applications/application-hired", context);
        String subject = messageSource.getMessage("email.application.hired.subject", null, locale);

        sendEmail(curriculum.getApplicantEmail(), subject, html);
    }

    public void sendAppointmentReminderEmail(Appointment appointment, Locale locale) {
        try {
            Context context = new Context(locale);
            context.setVariable("parentName", appointment.getParentName());
            context.setVariable("childName", appointment.getChildName());

            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            context.setVariable("appointmentDate", appointment.getAppointmentDate().format(dateFormatter));

            context.setVariable("parentNotes",
                    appointment.getParentNotes() != null ? appointment.getParentNotes() : "Ninguna");

            String htmlContent = templateEngine.process("email/appointments/appointment-reminder", context);

            String subject;
            String lang = locale.getLanguage();

            if ("en".equals(lang)) {
                subject = "Reminder: Your appointment at My Green Farm tomorrow";
            } else if ("fr".equals(lang)) {
                subject = "Rappel : Votre rendez-vous à My Green Farm est demain";
            } else {
                subject = "Recordatorio: Tu cita en My Green Farm es mañana";
            }

            sendEmail(appointment.getParentEmail(), subject, htmlContent);
            System.out.println("Correo de recordatorio enviado exitosamente a: " + appointment.getParentEmail());

        } catch (Exception e) {
            System.err.println("Error al enviar el correo de recordatorio: " + e.getMessage());
            throw new RuntimeException("No se pudo enviar el correo de recordatorio", e);
        }
    }

    @Async
    public void sendBirthdayReminderEmail(List<User> teachers, LocalDate birthdayDate, Locale locale) {
        Context context = new Context(locale);
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("birthdayDate", birthdayDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        context.setVariable("teacherNames", teachers.stream()
                .map(t -> t.getFirstName() + " " + t.getLastName())
                .toList());

        String html = templateEngine.process("email/birthday/birthday-reminder", context);
        String subject = messageSource.getMessage("email.birthday.reminder.subject", null, locale);

        sendEmail(correoAdmin, subject, html);
    }

    @Async
    public void sendBirthdayGreetingEmail(User teacher, LocalDate birthdayDate, Locale locale) {
        Context context = new Context(locale);
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("teacherName", teacher.getFirstName());
        context.setVariable("birthdayDate", birthdayDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        String html = templateEngine.process("email/birthday/birthday-greeting", context);
        String subject = messageSource.getMessage("email.birthday.greeting.subject", null, locale);

        sendEmail(teacher.getEmail(), subject, html);
    }

    @Async
    public void sendBroadcastEmail(List<SubscriberEmailProjection> recipients, String subject,
            String messageContent) {
        Map<String, List<String>> translatedContentByLanguage = new HashMap<>();
        Map<String, Long> recipientsByLanguage = new HashMap<>();
        for (SubscriberEmailProjection recipient : recipients) {
            recipientsByLanguage.merge(normalizeNewsletterLanguage(recipient.getLanguage()), 1L, Long::sum);
        }
        log.info("Newsletter recipients by saved language: {}", recipientsByLanguage);

        for (SubscriberEmailProjection recipient : recipients) {
            try {
                String targetLanguage = normalizeNewsletterLanguage(recipient.getLanguage());
                Locale locale = Locale.forLanguageTag(targetLanguage);

                List<String> translatedContent = translatedContentByLanguage.get(targetLanguage);
                if (translatedContent == null) {
                    try {
                        translatedContent = translationService.translateBatchWithoutSaving(
                                List.of(subject, messageContent), targetLanguage, "text/plain");
                        if (translatedContent.size() != 2) {
                            throw new IOException("Google Translate no devolvió el asunto y el mensaje.");
                        }
                        if (!subject.isBlank() && translatedContent.get(0).isBlank()) {
                            throw new IOException("Google Translate devolvió un asunto vacío.");
                        }
                        if (!messageContent.isBlank() && translatedContent.get(1).isBlank()) {
                            throw new IOException("Google Translate devolvió un mensaje vacío.");
                        }
                        if (messageContent.trim().length() > 1 && translatedContent.get(1).trim().length() <= 1) {
                            log.warn("La traducción del cuerpo al idioma {} llegó truncada; se conservará el original.",
                                    targetLanguage);
                            translatedContent = List.of(translatedContent.get(0), messageContent);
                        }
                    } catch (Exception e) {
                        log.warn("No se pudo traducir el boletín al idioma {}; se enviará el texto original.",
                                targetLanguage, e);
                        translatedContent = List.of(subject, messageContent);
                    }
                    translatedContentByLanguage.put(targetLanguage, translatedContent);
                }

                Context context = new Context(locale);
                context.setVariable("supportEmail", supportEmail);
                context.setVariable("frontendUrl", frontendUrl);
                context.setVariable("broadcastMessage", translatedContent.get(1));
                context.setVariable("recipientEmail", recipient.getEmail());

                boolean isSubscriber = newsletterRepository.existsByEmailAndIsActiveTrue(recipient.getEmail());
                context.setVariable("isSubscriber", isSubscriber);

                String html = templateEngine.process("email/newsletter_suscriber/broadcast-newsletter", context);

                sendEmail(recipient.getEmail(), translatedContent.get(0), html);

            } catch (Exception e) {
                log.error("Error al enviar boletín masivo a {}: {}", recipient.getEmail(), e.getMessage(), e);
            }
        }
    }

    private String normalizeNewsletterLanguage(String language) {
        if (language == null || language.isBlank()) {
            return "es";
        }
        String normalized = language.toLowerCase(Locale.ROOT).split("[-_]")[0];
        return List.of("es", "en", "fr").contains(normalized) ? normalized : "es";
    }

}
