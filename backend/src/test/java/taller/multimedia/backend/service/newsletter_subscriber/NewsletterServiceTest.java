package taller.multimedia.backend.service.newsletter_subscriber;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.newsletter_subscriber.NewsletterSubscriber;
import taller.multimedia.backend.repository.newsletter_subscriber.NewsletterSubscriberRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NewsletterServiceTest {

    @Mock
    private NewsletterSubscriberRepository newsletterRepository;

    @InjectMocks
    private NewsletterService newsletterService;

    @Test
    void subscribe_rejectsHtmlInEmailAndNeverSaves() {
        assertThrows(InvalidFieldException.class,
                () -> newsletterService.subscribe("<script>alert(1)</script>@gmail.com", "es"));

        verify(newsletterRepository, never()).findByEmail(anyString());
        verify(newsletterRepository, never()).save(any());
    }

    @Test
    void subscribe_acceptsValidEmail() {
        when(newsletterRepository.findByEmail("familia@gmail.com")).thenReturn(Optional.empty());
        when(newsletterRepository.save(any(NewsletterSubscriber.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NewsletterSubscriber saved = newsletterService.subscribe("  Familia@Gmail.com ", "es");

        assertThat(saved.getEmail()).isEqualTo("familia@gmail.com");
    }
}
