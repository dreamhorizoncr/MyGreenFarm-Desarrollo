package taller.multimedia.backend;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import jakarta.annotation.PostConstruct;

@SpringBootApplication
@EnableScheduling
public class BackendApplication {

	@PostConstruct 
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("America/Costa_Rica"));
    }
	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
