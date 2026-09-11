package taller.multimedia.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;

import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final MessageSource messageSource;

    @Value("${mail.from}")
    private String fromAddress;

    @Value("${mail.support}")
    private String supportEmail;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${daycare.mail.admin}")
    private String correoAdmin;

    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine, MessageSource messageSource) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.messageSource = messageSource;
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetLink = frontendUrl.replaceAll("/+$", "")
                + "/reset-password?token=" + resetToken;

        Context context = new Context();
        context.setVariable("resetLink", resetLink);
        context.setVariable("supportEmail", supportEmail);

        String html = templateEngine.process("email/reset-password", context);

        sendEmail(toEmail, "Cambio de contraseña", html);
    }

    private void sendEmail(String toEmail, String subject, String html) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true); // true = es HTML

            mailSender.send(mensaje);
            log.info("Correo '{}' enviado a: {}", subject, toEmail);
        } catch (MessagingException e) {
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

        String html = templateEngine.process("email/appointment-pending", context);
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
                ? "email/appointment-confirmed"
                : "email/appointment-cancelled";

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

            String html = templateEngine.process("email/appointment-reschedule", context);

            String subject = messageSource.getMessage("email.appointment.reschedule.subject", null, locale);

            sendEmail(appointment.getParentEmail(), subject, html);

        } catch (Exception e) {
            log.error("Error al preparar el correo de reprogramación para {}: {}", appointment.getParentEmail(),
                    e.getMessage(), e);
            throw new RuntimeException("Error al enviar el correo de reprogramación", e);
        }
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

            String htmlContent = templateEngine.process("email/appointment-reminder", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(appointment.getParentEmail());
            helper.setSubject(locale.getLanguage().equals("en")
                    ? "Reminder: Your appointment at My Green Farm tomorrow"
                    : "Recordatorio: Tu cita en My Green Farm es mañana");

            helper.setText(htmlContent, true); 

            mailSender.send(message);
            System.out.println("Correo de recordatorio enviado exitosamente a: " + appointment.getParentEmail());

        } catch (Exception e) {
            System.err.println("Error al enviar el correo de recordatorio: " + e.getMessage());
            throw new RuntimeException("No se pudo enviar el correo de recordatorio", e);
        }
    }
}