package taller.multimedia.backend.controller.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health check used by the hosting platform to know the backend is running.
 */
@RestController
public class HealthController {
    /**
     * @return {@code OK}
     */
    @GetMapping("/api/health")
    public String health() {
        return "OK";
    }
}
