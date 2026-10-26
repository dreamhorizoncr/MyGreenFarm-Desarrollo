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
        assertTrue(builder.buildContext(auth("OWNER")).contains("administrar agenda"));
        assertTrue(builder.buildContext(auth("ADMIN")).contains("anuncios"));
        assertTrue(builder.buildContext(auth("TEACHER")).contains("trabajo docente"));
        String unknown = builder.buildContext(auth("PARENT"));
        assertTrue(unknown.contains("únicamente información pública"));
        assertFalse(unknown.contains("visitante sin sesión"));
        assertFalse(unknown.contains("expedientes"));
    }
}
