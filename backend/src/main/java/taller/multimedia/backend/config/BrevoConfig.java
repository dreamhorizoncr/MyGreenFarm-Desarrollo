package taller.multimedia.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.beans.factory.annotation.Value;

/**
 * Reads the Brevo settings ({@code brevo.api.key}, {@code brevo.sender.email}, {@code
 * brevo.sender.name}).
 */
@Configuration 
public class BrevoConfig {

    @Value ("${brevo.api.key}")
    private String apiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    @Value("${brevo.sender.name}")
    private String senderName;

    /**
     * @return the Brevo settings used by {@code BrevoEmailService}
     */
    @Bean 
    public BrevoProperties brevoProperties() {
        return new BrevoProperties(apiKey, senderEmail, senderName);
    }
}
