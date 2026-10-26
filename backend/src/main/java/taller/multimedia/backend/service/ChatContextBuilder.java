package taller.multimedia.backend.service;

import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class ChatContextBuilder {
    private static final String PUBLIC_CONTEXT = """
            INFORMACIÓN PÚBLICA DE MY GREEN FARM:
            - Centro educativo acreditado por el MEP con programas de guardería y preescolar para niños desde los 3 meses hasta los 12 años.
            - El sitio incluye Inicio, Sobre nosotros, Servicios y planes, Clubes, Reserva de citas, Noticias, Foro, Galería, Vacantes y Contacto.
            - Ubicación general: Liberia, Guanacaste, Costa Rica. Para la ubicación exacta en Google Maps, orienta a la sección Contacto del sitio.
            - Para consultar horarios disponibles y agendar una cita, orienta a la sección Reservar cita.
            - Los horarios de las lecciones se disponen después de completar la matrícula y se comunican al encargado.
            - Para consultas generales, el contacto público es +506 8327-8347 por WhatsApp.
            - Usa solo los datos institucionales disponibles aquí; no inventes precios, horarios, cupos ni estados actuales.
            """;
    private static final String VISITOR_RULES = """
            ACCESO: visitante sin sesión autenticada.
            - Responde consultas sobre la información pública del contexto.
            - No proporciones datos, registros o funciones internas.
            """;
    private static final String UNKNOWN_AUTHENTICATED_CONTEXT = """
            ALCANCE: únicamente información pública indicada en este contexto. No infieras permisos adicionales ni proporciones datos internos.
            """;
    private static final String OWNER_CONTEXT = """
            ALCANCE AUTORIZADO:
            - Orientación general para administrar agenda y horarios, planes de servicio, clubes, noticias, galería, vacantes, boletín, currículos, usuarios, citas, padres, estudiantes y evaluaciones.
            - No consultes ni proporciones registros, expedientes, datos personales ni detalles actuales de cuentas.
            """;
    private static final String ADMIN_CONTEXT = """
            ALCANCE AUTORIZADO:
            - Orientación general para anuncios, galería, vacantes, currículos, citas, usuarios, padres, estudiantes y evaluaciones.
            - No consultes ni proporciones registros, expedientes, datos personales ni detalles actuales de cuentas.
            - No infieras permisos de otras funciones.
            """;
    private static final String TEACHER_CONTEXT = """
            ALCANCE AUTORIZADO:
            - Orientación general para el trabajo docente, expedientes, evaluaciones y publicaciones propias del foro.
            - No consultes ni proporciones expedientes, evaluaciones ni datos personales de estudiantes.
            """;

    public String buildContext(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return PUBLIC_CONTEXT + "\n" + VISITOR_RULES;
        }
        Set<String> roles = authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring(5))
                .collect(Collectors.toSet());
        String roleContext = roles.contains("OWNER") ? OWNER_CONTEXT
                : roles.contains("ADMIN") ? ADMIN_CONTEXT
                : roles.contains("TEACHER") ? TEACHER_CONTEXT
                : UNKNOWN_AUTHENTICATED_CONTEXT;
        return PUBLIC_CONTEXT + "\n" + roleContext;
    }
}
