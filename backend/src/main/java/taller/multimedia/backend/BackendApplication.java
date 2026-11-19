package taller.multimedia.backend;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;

/**
 * Entry point of the My Green Farm backend: a Spring Boot REST API with scheduled jobs and
 * asynchronous tasks enabled.
 */
@SpringBootApplication
@EnableScheduling
@EnableAsync 
public class BackendApplication {

    /**
     * Sets the JVM's default time zone to Costa Rica, so dates without a zone (appointments,
     * schedules, birthdays) are always local time.
     */
	@PostConstruct 
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("America/Costa_Rica"));
    }
	
    /**
     * @return a shared HTTP client; reserved for electronic billing, which is currently disabled
     */
	@Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
	/**
	 * @param args command line arguments
	 */
	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
