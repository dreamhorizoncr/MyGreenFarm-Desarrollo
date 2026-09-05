package taller.multimedia.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;

@Configuration
public class GoogleTranslateConfig {

    @Value("${google.cloud.credentials-json}")
    private String credentialsJson;

    @Bean
    public GoogleCredentials googleCredentials() throws IOException {
        byte[] decodedBytes = Base64.getDecoder().decode(credentialsJson);
        return GoogleCredentials.fromStream(new ByteArrayInputStream(decodedBytes))
            .createScoped("https://www.googleapis.com/auth/cloud-translation");
    }
}
