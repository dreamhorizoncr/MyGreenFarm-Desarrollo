package taller.multimedia.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${mail.from}")
    private String fromAddress; 

    @Value("${mail.support}")
    private String supportEmail;

    @Value("${frontend.url}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetLink = frontendUrl.replaceAll("/+$", "")
                + "/reset-password?token=" + resetToken;

        Context context = new Context();
        context.setVariable("resetLink", resetLink);
        context.setVariable("supportEmail", supportEmail);

        String html = templateEngine.process("email/reset-password", context);

        enviarCorreo(toEmail, "Cambio de contraseña", html);
    }

    private void enviarCorreo(String toEmail, String asunto, String html) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject(asunto);
            helper.setText(html, true); // true = es HTML

            mailSender.send(mensaje);
            log.info("Correo '{}' enviado a: {}", asunto, toEmail);
        } catch (MessagingException e) {
            log.error("Error enviando correo a {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("No se pudo enviar el correo", e);
        }
    }
}