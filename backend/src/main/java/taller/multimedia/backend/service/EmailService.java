package taller.multimedia.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;

@Service
public class EmailService {

    @Value("${resend.token}")
    private String emailToken;

    @Value("${frontend.url}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        Resend resend = new Resend(emailToken);

        // Aquí ya existe resetToken porque viene en los parámetros
        String resetLink = frontendUrl.replaceAll("/+$", "")
            + "/reset-password?token=" + resetToken;

        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from("onboarding@resend.dev")
                    .to(toEmail)
                    .subject("Cambio de contraseña")
                    .html("<h1>Has solicitado un cambio de contraseña</h1>" +
                            "<p>Haz clic en el siguiente enlace para restablecerla:</p>" +
                            "<a href='" + resetLink + "'>Restablecer contraseña</a>" +
                            "<p>Si no fuiste tú, contáctanos al correo</p>")
                    .build();

            resend.emails().send(params);
            System.out.println("Correo de recuperación enviado a: " + toEmail);
        } catch (ResendException e) {
            e.printStackTrace();
        }
    }
}