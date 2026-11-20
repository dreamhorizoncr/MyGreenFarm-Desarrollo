package taller.multimedia.backend;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Integration test that starts the whole application. It needs the real environment (database,
 * mail, Google, Supabase Storage), so it only runs where those variables are configured, for
 * example in the deployment pipeline; in a machine without them it is skipped instead of failing.
 */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "DB_HOST", matches = ".+")
class BackendApplicationTests {

	@Test
	void contextLoads() {
		// fails if any bean cannot be created with the configured environment
	}

}
