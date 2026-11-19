package taller.multimedia.backend.config;

import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Thread pool for background tasks (AI summaries, spelling correction, Google Calendar sync).
 */
@Configuration 
public class AsyncConfig {

    /**
     * @return the {@code taskExecutor} pool: 5 threads, up to 10, with a queue of 100 tasks
     */
    @Bean (name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("Async-");
        executor.initialize();
        return executor;
    }
}
