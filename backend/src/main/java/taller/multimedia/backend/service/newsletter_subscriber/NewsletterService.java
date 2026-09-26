package taller.multimedia.backend.service.newsletter_subscriber;

import org.springframework.stereotype.Service;

import taller.multimedia.backend.model.newsletter_subscriber.NewsletterSubscriber;
import taller.multimedia.backend.repository.newsletter_subscriber.NewsletterSubscriberRepository;

@Service 
public class NewsletterService {

    private final NewsletterSubscriberRepository newsletterRepository;

    public NewsletterService(NewsletterSubscriberRepository newsletterRepository) {
        this.newsletterRepository = newsletterRepository;
    }

    public void unsubscribe(String email) {
        NewsletterSubscriber subscriber = newsletterRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("El correo no se encuentra registrado en el boletín."));

        subscriber.setIsActive(false);
        newsletterRepository.save(subscriber);
    }
}
