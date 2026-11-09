package taller.multimedia.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class ChatContextBuilderTest {
    private final ChatContextBuilder builder = new ChatContextBuilder();
    private UsernamePasswordAuthenticationToken auth(String role) {
        return new UsernamePasswordAuthenticationToken("user", "", List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }
    @Test void buildsDistinctSafeRoleContexts() {
        assertTrue(builder.buildContext(auth("OWNER")).contains("manage the schedule"));
        assertTrue(builder.buildContext(auth("ADMIN")).contains("announcements"));
        assertTrue(builder.buildContext(auth("TEACHER")).contains("teaching work"));
        String unknown = builder.buildContext(auth("PARENT"));
        assertTrue(unknown.contains("only the public information"));
        assertFalse(unknown.contains("visitor without an authenticated session"));
        assertFalse(unknown.contains("student files"));
    }

    @Test void includesVerifiedPublicContactInformation() {
        String context = builder.buildContext(null);

        assertTrue(context.contains("Liberia, Guanacaste, Costa Rica"));
        assertTrue(context.contains("booking form"));
        assertTrue(context.contains("enrollment"));
        assertTrue(context.contains("+506 8327-8347"));
        assertFalse(context.contains("PENDING REAL DATA"));
    }
}
