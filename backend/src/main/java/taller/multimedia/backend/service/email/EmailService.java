package taller.multimedia.backend.service.email;

import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.model.curriculum.Curriculum;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.newsletter.NewsletterSubscriberRepository;
import taller.multimedia.backend.repository.newsletter.SubscriberEmailProjection;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.internet.MimeMessage;

/**
 * Builds and sends the site's emails from the Thymeleaf templates in {@code templates/email},
 * through Brevo.
 *
 * <p>Emails to families and applicants are written in their language (Spanish, English or French)
 * using the subjects in {@code messages*.properties}; alerts to the administration are always in
 * Spanish. Most methods run asynchronously so the user's request does not wait for the email.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final TemplateEngine templateEngine;
    private final MessageSource messageSource;
    private final BrevoEmailService brevoEmailService;
    private final NewsletterSubscriberRepository newsletterRepository;
    private final TranslationService translationService;
    private final JavaMailSender mailSender;

    @Value("${mail.support}")
    private String supportEmail;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${daycare.mail.admin}")
    private String adminEmail;

    @Value("${social.link:https://linktr.ee/dreamhorizoncr}")
    private String socialLink;

    /**
     * @param templateEngine renders the email templates
     * @param messageSource translated email subjects
     * @param brevoEmailService sends the emails
     * @param newsletterRepository tells whether a recipient is a newsletter subscriber
     * @param translationService translates the newsletter to each recipient's language
     * @param mailSender SMTP sender, used only for emails with attachments
     */
    public EmailService(TemplateEngine templateEngine,
            MessageSource messageSource,
            BrevoEmailService brevoEmailService,
            NewsletterSubscriberRepository newsletterRepository,
            TranslationService translationService,
            JavaMailSender mailSender) {
        this.templateEngine = templateEngine;
        this.messageSource = messageSource;
        this.brevoEmailService = brevoEmailService;
        this.newsletterRepository = newsletterRepository;
        this.translationService = translationService;
        this.mailSender = mailSender;
    }

    /**
     * Hides most of an email address before it is written to the logs, so they do not store
     * personal data. For example {@code ana.perez@gmail.com} becomes {@code a***@gmail.com}.
     *
     * @param email address to hide, may be {@code null}
     * @return the masked address, or {@code "(none)"} when there is no address
     */
    static String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "(none)";
        }
        int at = email.indexOf('@');
        return at <= 0 ? "***" : email.charAt(0) + "***" + email.substring(at);
    }

    /**
     * @param locale language of the email, or {@code null} for the default
     * @return a template context with the support email, site URL and social media link
     */
    private Context createBaseContext(Locale locale) {
        Context context = (locale != null) ? new Context(locale) : new Context();
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("frontendUrl", frontendUrl);
        context.setVariable("socialLink", socialLink);
        return context;
    }

    private Context createBaseContext() {
        return createBaseContext(null);
    }

    /**
     * Emails the link to choose a new password.
     *
     * @param toEmail user's email
     * @param resetToken token included in the link
     */
    @Async
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetLink = frontendUrl.replaceAll("/+$", "")
                + "/reset-password?token=" + resetToken;

        Context context = createBaseContext();
        context.setVariable("resetLink", resetLink);
        context.setVariable("supportEmail", supportEmail);

        String html = templateEngine.process("email/auth/reset-password", context);

        sendEmail(toEmail, "Cambio de contraseña", html);
    }

    /**
     * @param toEmail recipient
     * @param subject subject
     * @param html rendered body
     * @throws RuntimeException if Brevo fails
     */
    private void sendEmail(String toEmail, String subject, String html) {
        try {
            long start = System.currentTimeMillis();
            brevoEmailService.sendEmail(toEmail, toEmail, subject, html);
            log.info("Email '{}' sent to {}", subject, maskEmail(toEmail));
            log.info("Sending the email took {} ms", System.currentTimeMillis() - start);
        } catch (IOException e) {
            log.error("Error sending email to {}: {}", maskEmail(toEmail), e.getMessage(), e);
            throw new RuntimeException("The email could not be sent", e);
        }
    }

    /**
     * Tells the family their appointment request was received and is pending confirmation.
     *
     * @param appointment new appointment
     * @param locale family's language
     */
    @Async
    public void sendAppointmentPendingEmail(Appointment appointment, Locale locale) {
        Context context = createBaseContext(locale);
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("childName", appointment.getChildName());

        String formattedDate = appointment.getAppointmentDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        context.setVariable("appointmentDate", formattedDate);

        String html = templateEngine.process("email/appointments/appointment-pending", context);
        String subject = messageSource.getMessage("email.appointment.pending.subject", null, locale);

        sendEmail(appointment.getParentEmail(), subject, html);
    }

    /**
     * Tells the family their appointment was confirmed, or cancelled for any other status.
     *
     * @param appointment updated appointment
     * @param locale family's language
     */
    @Async
    public void sendAppointmentStatusUpdateEmail(Appointment appointment, Locale locale) {
        Context context = createBaseContext(locale);
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

    /**
     * @param appointment new appointment, announced to the administration's email
     */
    @Async
    public void sendAdminNewAppointmentAlert(Appointment appointment) {
        String subject = "Nueva solicitud de cita pendiente";
        String body = String.format("El padre/madre %s solicitó una cita para el niño(a) %s.",
                appointment.getParentName(), appointment.getChildName());
        sendEmail(adminEmail, subject, "<p>" + body + "</p>");
    }

    /**
     * @param appointment confirmed appointment, announced to the administration's email
     */
    @Async
    public void sendAdminConfirmedAppointmentAlert(Appointment appointment) {
        String subject = "Cita confirmada";
        String body = String.format("El padre/madre %s que solicitó una cita para el niño(a) %s ha sido CONFIRMADA.",
                appointment.getParentName(), appointment.getChildName());
        sendEmail(adminEmail, subject, "<p>" + body + "</p>");
    }

    /**
     * @param appointment cancelled appointment, announced to the administration's email
     */
    @Async
    public void sendAdminCancelledAppointmentAlert(Appointment appointment) {
        String subject = "Cita cancelada";
        String body = String.format("El padre/madre %s que solicitó una cita para el niño(a) %s ha sido CANCELADA.",
                appointment.getParentName(), appointment.getChildName());
        sendEmail(adminEmail, subject, "<p>" + body + "</p>");
    }

    /**
     * Tells the family the new date of their appointment.
     *
     * @param appointment rescheduled appointment
     * @param locale family's language
     * @throws RuntimeException if the email cannot be built or sent
     */
    @Async
    public void sendRescheduleEmail(Appointment appointment, Locale locale) {
        try {
            Context context = createBaseContext(locale);
            context.setVariable("supportEmail", supportEmail);
            context.setVariable("childName", appointment.getChildName());

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            context.setVariable("appointmentDate", appointment.getAppointmentDate().format(formatter));

            String html = templateEngine.process("email/appointments/appointment-reschedule", context);

            String subject = messageSource.getMessage("email.appointment.reschedule.subject", null, locale);

            sendEmail(appointment.getParentEmail(), subject, html);

        } catch (Exception e) {
            log.error("Error preparing the reschedule email for {}: {}", maskEmail(appointment.getParentEmail()),
                    e.getMessage(), e);
            throw new RuntimeException("Error sending the reschedule email", e);
        }
    }

    /**
     * @param curriculum received application
     * @param vacancyTitle title of the vacancy, or the open application label
     * @param locale applicant's language
     */
    @Async
    public void sendApplicationReceivedEmail(Curriculum curriculum, String vacancyTitle, Locale locale) {
        Context context = createBaseContext(locale);
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("applicantName", curriculum.getApplicantName());
        context.setVariable("vacancyTitle", vacancyTitle);

        String html = templateEngine.process("email/applications/application-received", context);
        String subject = messageSource.getMessage("email.application.received.subject", null, locale);

        sendEmail(curriculum.getApplicantEmail(), subject, html);
    }

    /**
     * @param curriculum approved application
     * @param vacancyTitle title of the vacancy, may be {@code null}
     * @param locale applicant's language
     */
    @Async
    public void sendApplicationHiredEmail(Curriculum curriculum, String vacancyTitle, Locale locale) {
        Context context = createBaseContext(locale);
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("vacancyTitle", vacancyTitle);

        String html = templateEngine.process("email/applications/application-hired", context);
        String subject = messageSource.getMessage("email.application.hired.subject", null, locale);

        sendEmail(curriculum.getApplicantEmail(), subject, html);
    }

    /**
     * Reminds the family of their appointment the day before. Runs synchronously so the caller
     * knows whether to mark the reminder as sent.
     *
     * @param appointment confirmed appointment
     * @param locale family's language
     * @throws RuntimeException if the email cannot be sent
     */
    public void sendAppointmentReminderEmail(Appointment appointment, Locale locale) {
        try {
            Context context = createBaseContext(locale);
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
            log.info("Reminder email sent successfully for appointment ID: {}", appointment.getId());

        } catch (Exception e) {
            log.warn("Error sending the reminder email: {}", e.getMessage());
            throw new RuntimeException("The reminder email could not be sent", e);
        }
    }

    /**
     * @param teachers teachers whose birthday is coming
     * @param birthdayDate day of the birthday
     * @param locale language of the email, sent to the administration
     */
    @Async
    public void sendBirthdayReminderEmail(List<User> teachers, LocalDate birthdayDate, Locale locale) {
        Context context = createBaseContext(locale);
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("birthdayDate", birthdayDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        context.setVariable("teacherNames", teachers.stream()
                .map(teacher -> teacher.getFirstName() + " " + teacher.getLastName())
                .toList());

        String html = templateEngine.process("email/birthday/birthday-reminder", context);
        String subject = messageSource.getMessage("email.birthday.reminder.subject", null, locale);

        sendEmail(adminEmail, subject, html);
    }

    /**
     * @param teacher teacher whose birthday is today
     * @param birthdayDate today
     * @param locale language of the email
     */
    @Async
    public void sendBirthdayGreetingEmail(User teacher, LocalDate birthdayDate, Locale locale) {
        Context context = createBaseContext(locale);
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("teacherName", teacher.getFirstName());
        context.setVariable("birthdayDate", birthdayDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        String html = templateEngine.process("email/birthday/birthday-greeting", context);
        String subject = messageSource.getMessage("email.birthday.greeting.subject", null, locale);

        sendEmail(teacher.getEmail(), subject, html);
    }

    /**
     * Sends a newsletter to each recipient in their language. The subject and message are
     * translated once per language; if the translation fails or comes back truncated, the original
     * is sent. A failure with one recipient is logged and the rest are still sent.
     *
     * @param recipients active recipients with their language
     * @param subject subject in Spanish
     * @param messageContent message in Spanish
     */
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
                            throw new IOException("Google Translate did not return the subject and the message.");
                        }
                        if (!subject.isBlank() && translatedContent.get(0).isBlank()) {
                            throw new IOException("Google Translate returned an empty subject.");
                        }
                        if (!messageContent.isBlank() && translatedContent.get(1).isBlank()) {
                            throw new IOException("Google Translate returned an empty message.");
                        }
                        if (messageContent.trim().length() > 1 && translatedContent.get(1).trim().length() <= 1) {
                            log.warn("The body translation to {} came back truncated; the original will be kept.",
                                    targetLanguage);
                            translatedContent = List.of(translatedContent.get(0), messageContent);
                        }
                    } catch (Exception e) {
                        log.warn("Could not translate the newsletter to {}; the original text will be sent.",
                                targetLanguage, e);
                        translatedContent = List.of(subject, messageContent);
                    }
                    translatedContentByLanguage.put(targetLanguage, translatedContent);
                }

                Context context = createBaseContext(locale);
                context.setVariable("supportEmail", supportEmail);
                context.setVariable("frontendUrl", frontendUrl);
                context.setVariable("broadcastMessage", translatedContent.get(1));
                context.setVariable("recipientEmail", recipient.getEmail());

                boolean isSubscriber = newsletterRepository.existsByEmailAndIsActiveTrue(recipient.getEmail());
                context.setVariable("isSubscriber", isSubscriber);

                String html = templateEngine.process("email/newsletter/broadcast-newsletter", context);

                sendEmail(recipient.getEmail(), translatedContent.get(0), html);

            } catch (Exception e) {
                log.error("Error sending the bulk newsletter to {}: {}", maskEmail(recipient.getEmail()), e.getMessage(), e);
            }
        }
    }

    /**
     * Emails a parent the semiannual summary of their child's progress. Errors are only logged.
     *
     * @param parentEmail parent's email
     * @param childName child's name, shown in the subject
     * @param summaryText summary already in the parent's language
     * @param period semester and year
     * @param parentLanguage parent's language
     */
    @Async
    public void sendSemiannualEvaluationSummaryEmail(String parentEmail, String childName, String summaryText,
            String period, String parentLanguage) {
        try {
            String lang = normalizeNewsletterLanguage(parentLanguage);
            Locale locale = Locale.forLanguageTag(lang);

            Context context = createBaseContext(locale);
            context.setVariable("childName", childName);
            context.setVariable("summaryText", summaryText);
            context.setVariable("period", period);
            context.setVariable("supportEmail", supportEmail);

            String subject;
            switch (lang) {
                case "en":
                    subject = "Semiannual Progress Report - " + childName;
                    break;
                case "fr":
                    subject = "Rapport de Progrès Semestriel - " + childName;
                    break;
                default:
                    subject = "Resumen de Progreso Semestral - " + childName;
                    break;
            }

            String htmlContent = templateEngine.process("email/evaluations/semiannual-summary", context);

            sendEmail(parentEmail, subject, htmlContent);
            log.info("Semester summary sent successfully to {} (language: {})", maskEmail(parentEmail), lang);
        } catch (Exception e) {
            log.error("Error sending the semester summary to {}: {}", maskEmail(parentEmail), e.getMessage(), e);
        }
    }

    /**
     * Sends an email with a PDF attached through SMTP. Part of electronic billing, which is
     * currently disabled. Errors are only logged.
     *
     * @param to recipient
     * @param subject subject
     * @param htmlContent rendered body
     * @param pdfBytes PDF file, optional
     * @param pdfFilename name of the attachment
     */
    @Async
    public void sendEmailWithAttachment(String to, String subject, String htmlContent, byte[] pdfBytes,
            String pdfFilename) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            if (pdfBytes != null && pdfBytes.length > 0) {
                helper.addAttachment(pdfFilename, new ByteArrayResource(pdfBytes));
            }

            mailSender.send(message);
            log.info("Email with attached invoice sent successfully to {}", maskEmail(to));
        } catch (Exception e) {
            log.error("Error sending email with attachment to {}: {}", maskEmail(to), e.getMessage(), e);
        }
    }

    /**
     * Sends an electronic invoice in Spanish. Part of electronic billing, which is currently
     * disabled.
     *
     * @param clientEmail client's email
     * @param clientName client's name
     * @param pdfBytes invoice PDF
     */
    @Async
    public void sendInvoiceWithPdf(String clientEmail, String clientName, byte[] pdfBytes) {
        sendInvoiceWithPdf(clientEmail, clientName, pdfBytes, Locale.forLanguageTag("es"));
    }

    /**
     * Sends an electronic invoice in the client's language. Part of electronic billing, which is
     * currently disabled. Errors are only logged.
     *
     * @param clientEmail client's email
     * @param clientName client's name
     * @param pdfBytes invoice PDF
     * @param requestedLocale client's language, or {@code null} for Spanish
     */
    @Async
    public void sendInvoiceWithPdf(String clientEmail, String clientName, byte[] pdfBytes, Locale requestedLocale) {
        try {
            Locale locale = resolveInvoiceLocale(requestedLocale);
            Context context = createBaseContext(locale);
            context.setVariable("clientName", clientName);
            context.setVariable("websiteUrl", frontendUrl);

            String htmlContent = templateEngine.process("email/billing/invoice-success", context);

            String subject = messageSource.getMessage("email.billing.subject", null, locale);
            sendEmailWithAttachment(clientEmail, subject, htmlContent, pdfBytes, "FacturaElectronica.pdf");

            log.info("Email with attached electronic invoice sent successfully to {}", maskEmail(clientEmail));
        } catch (Exception e) {
            log.error("Error sending the electronic invoice email with attachment to {}: {}", maskEmail(clientEmail),
                    e.getMessage(), e);
        }
    }

    // @Async
    // public void sendInvoiceWithPdf(String clientEmail, String clientName, Map<String, Object> invoiceResponse) {
    //     sendInvoiceWithPdf(clientEmail, clientName, invoiceResponse, Locale.forLanguageTag("es"));
    // }

    // @Async
    // public void sendInvoiceWithPdf(String clientEmail, String clientName, Map<String, Object> invoiceResponse,
    //         Locale requestedLocale) {
    //     try {
    //         byte[] pdfBytes = null;

    //         if (invoiceResponse != null) {
    //             if (invoiceResponse.get("pdf") != null) {
    //                 String pdfBase64 = (String) invoiceResponse.get("pdf");
    //                 if (!pdfBase64.isBlank()) {
    //                     pdfBytes = java.util.Base64.getDecoder().decode(pdfBase64);
    //                 }
    //             }
    //             else if (invoiceResponse.get("documentId") != null) {
    //                 String documentId = (String) invoiceResponse.get("documentId");
    //                 log.info(">>> Documento en cola detectado (ID: {}). Iniciando reintentos de descarga...",
    //                         documentId);

    //                 pdfBytes = electronicBillingService.downloadPdfWithRetry(documentId);
    //             }
    //         }

    //         Locale locale = resolveInvoiceLocale(requestedLocale);
    //         Context context = createBaseContext(locale);
    //         context.setVariable("clientName", clientName);
    //         context.setVariable("websiteUrl", frontendUrl);

    //         String htmlContent = templateEngine.process("email/billing/invoice-success", context);

    //         String subject = messageSource.getMessage("email.billing.subject", null, locale);
    //         sendEmailWithAttachment(clientEmail, subject, htmlContent, pdfBytes, "FacturaElectronica.pdf");

    //         log.info("Email with attached electronic invoice sent successfully to: {}", clientEmail);
    //     } catch (Exception e) {
    //         log.error("Error sending the electronic invoice email with attachment to {}: {}", clientEmail,
    //                 e.getMessage(), e);
    //     }
    // }

    private Locale resolveInvoiceLocale(Locale requestedLocale) {
        if (requestedLocale == null) {
            return Locale.forLanguageTag("es");
        }
        String language = requestedLocale.getLanguage().toLowerCase(Locale.ROOT);
        return List.of("es", "en", "fr").contains(language)
                ? Locale.forLanguageTag(language)
                : Locale.forLanguageTag("es");
    }

    private String normalizeNewsletterLanguage(String language) {
        if (language == null || language.isBlank()) {
            return "es";
        }
        String normalized = language.toLowerCase(Locale.ROOT).split("[-_]")[0];
        return List.of("es", "en", "fr").contains(normalized) ? normalized : "es";
    }

}
