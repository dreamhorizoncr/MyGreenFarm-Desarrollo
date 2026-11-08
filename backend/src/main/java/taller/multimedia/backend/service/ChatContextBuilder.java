package taller.multimedia.backend.service;

import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class ChatContextBuilder {
    private static final String PUBLIC_CONTEXT = """
            PUBLIC INFORMATION ABOUT MY GREEN FARM:
            - Educational center accredited by the MEP with daycare and preschool programs for children from 3 months to 12 years old.
            - The site includes Home, About us, Services, Clubs, Book an appointment, News, Forum, Gallery, Vacancies, Green Hearts and a footer with social media, contact details and Terms and Privacy.
            - Where topics are: News (notices, events and transportation), Gallery (photos and albums), Forum (opinions, posts and research), Services (prices and plans), Clubs, Vacancies (jobs and applications), About us (history, owners and origin), Green Hearts (social action). The footer holds social media, Terms and Privacy and contact details.
            - General location: Liberia, Guanacaste, Costa Rica. For the exact location on Google Maps, point to the Contact section in the footer.
            - To book an appointment, the chat can start the booking form directly; the form checks the real availability of time slots.
            - Do not make up time slots, spots or confirmations. Do not ask for personal data by message: the form requests it securely.
            - Lesson schedules are set after enrollment is completed and are shared with the guardian.
            - For general questions, the public contact is +506 8327-8347 on WhatsApp.
            - Use only the institutional data available here; do not make up prices, schedules, spots or current statuses.
            """;
    private static final String VISITOR_RULES = """
            ACCESS: visitor without an authenticated session.
            - Answer questions about the public information in the context.
            - Do not provide internal data, records or features.
            """;
    private static final String UNKNOWN_AUTHENTICATED_CONTEXT = """
            SCOPE: only the public information given in this context. Do not infer additional permissions or provide internal data.
            """;
    private static final String OWNER_CONTEXT = """
            AUTHORIZED SCOPE:
            - General guidance to manage the schedule and time slots, clubs, news, gallery, vacancies, newsletter, résumés, users, appointments, parents, students and evaluations.
            - Do not provide information about service plans; say that this information is not available in this chat.
            - Do not look up or provide records, student files, personal data or current account details.
            """;
    private static final String ADMIN_CONTEXT = """
            AUTHORIZED SCOPE:
            - General guidance for announcements, gallery, vacancies, résumés, appointments, users, parents, students and evaluations.
            - Do not look up or provide records, student files, personal data or current account details.
            - Do not infer permissions from other roles.
            """;
    private static final String TEACHER_CONTEXT = """
            AUTHORIZED SCOPE:
            - General guidance for teaching work, student files, evaluations and their own forum posts.
            - Do not look up or provide student files, evaluations or personal data of students.
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
