package taller.multimedia.backend.service.newsletter_subscriber;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.newsletter_subscriber.AudienceType;
import taller.multimedia.backend.dto.newsletter_subscriber.BroadcastEmail;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.repository.newsletter_subscriber.NewsletterSubscriberRepository;
import taller.multimedia.backend.repository.parent.ParentRepository;
import taller.multimedia.backend.service.EmailService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
        BroadcastEmail dto = new BroadcastEmail();
        dto.setSubject(subject);
        dto.setMessage(message);
        dto.setAudienceType(AudienceType.SUBSCRIBERS);
        dto.setLanguage("es");
        return dto;
    }

    @Test
    void sendBroadcast_rejectsAMaliciousSubjectAndNeverSendsAnything() {
        BroadcastEmail dto = requestWith("<script>alert(1)</script>Novedades", "Hola familias");

        assertThrows(InvalidFieldException.class, () -> broadcastService.sendBroadcast(dto));

        verify(emailService, never()).sendBroadcastEmail(any(), anyString(), anyString());
    }

    @Test
    void sendBroadcast_rejectsAMaliciousMessageAndNeverSendsAnything() {
        BroadcastEmail dto = requestWith("Novedades", "<img src=x onerror=alert(1)>Hola familias");

        assertThrows(InvalidFieldException.class, () -> broadcastService.sendBroadcast(dto));

        verify(emailService, never()).sendBroadcastEmail(any(), anyString(), anyString());
    }

    @Test
    void sendBroadcast_keepsTheLineBreaksInTheMessage() {
        String multilineMessage = "Hola familias.\n\nEste mes tuvimos varias novedades.";
        BroadcastEmail dto = requestWith("Novedades de octubre", multilineMessage);

        lenient().when(newsletterRepository.findAllActiveSubscribersInfo()).thenReturn(List.of());

        broadcastService.sendBroadcast(dto);

        ArgumentCaptor<String> messageCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendBroadcastEmail(any(), eq("Novedades de octubre"), messageCaptor.capture());
        assertThat(messageCaptor.getValue()).isEqualTo(multilineMessage);
    }
}
