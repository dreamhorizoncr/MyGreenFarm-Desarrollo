package taller.multimedia.backend.service.newsletter;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.newsletter.AudienceType;
import taller.multimedia.backend.dto.newsletter.BroadcastEmail;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.repository.newsletter.NewsletterSubscriberRepository;
import taller.multimedia.backend.repository.parent.ParentRepository;
import taller.multimedia.backend.service.email.EmailService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class BroadcastServiceTest {

    @Mock
    private NewsletterSubscriberRepository newsletterRepository;

    @Mock
    private ParentRepository parentRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private BroadcastService broadcastService;

    private BroadcastEmail requestWith(String subject, String message) {
        BroadcastEmail request = new BroadcastEmail();
        request.setSubject(subject);
        request.setMessage(message);
        request.setAudienceType(AudienceType.SUBSCRIBERS);
        request.setLanguage("es");
        return request;
    }

    @Test
    void sendBroadcast_rejectsAMaliciousSubjectAndNeverSendsAnything() {
        BroadcastEmail request = requestWith("<script>alert(1)</script>Novedades", "Hola familias");

        assertThrows(InvalidFieldException.class, () -> broadcastService.sendBroadcast(request));

        verify(emailService, never()).sendBroadcastEmail(any(), anyString(), anyString());
    }

    @Test
    void sendBroadcast_rejectsAMaliciousMessageAndNeverSendsAnything() {
        BroadcastEmail request = requestWith("Novedades", "<img src=x onerror=alert(1)>Hola familias");

        assertThrows(InvalidFieldException.class, () -> broadcastService.sendBroadcast(request));

        verify(emailService, never()).sendBroadcastEmail(any(), anyString(), anyString());
    }

    @Test
    void sendBroadcast_keepsTheLineBreaksInTheMessage() {
        String multilineMessage = "Hola familias.\n\nEste mes tuvimos varias novedades.";
        BroadcastEmail request = requestWith("Novedades de octubre", multilineMessage);

        lenient().when(newsletterRepository.findAllActiveSubscribersInfo()).thenReturn(List.of());

        broadcastService.sendBroadcast(request);

        ArgumentCaptor<String> messageCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendBroadcastEmail(any(), eq("Novedades de octubre"), messageCaptor.capture());
        assertThat(messageCaptor.getValue()).isEqualTo(multilineMessage);
    }
}
