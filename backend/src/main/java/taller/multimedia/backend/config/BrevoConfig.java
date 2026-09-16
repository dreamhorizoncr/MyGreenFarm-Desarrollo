package taller.multimedia.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.beans.factory.annotation.Value;

@Configuration 
public class BrevoConfig {

    @Value ("${brevo.api.key}")
    private String apiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    @Value("${brevo.sender.name}")
    private String senderName;

    @Bean 
    public BrevoProperties brevoProperties() {
        return new BrevoProperties(apiKey, senderEmail, senderName);
    }
}
