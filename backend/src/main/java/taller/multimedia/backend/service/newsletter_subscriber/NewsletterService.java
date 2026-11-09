package taller.multimedia.backend.service.newsletter_subscriber;

import taller.multimedia.backend.util.Sanitizer;
import org.springframework.stereotype.Service;
import taller.multimedia.backend.model.newsletter_subscriber.NewsletterSubscriber;
import taller.multimedia.backend.repository.newsletter_subscriber.NewsletterSubscriberRepository;

import java.util.List;

@Service 
public class NewsletterService {

    private final NewsletterSubscriberRepository newsletterRepository;

    public NewsletterService(NewsletterSubscriberRepository newsletterRepository) {
        this.newsletterRepository = newsletterRepository;
    }

    public NewsletterSubscriber subscribe(String email, String language) {
        String cleanEmail = sanitizeEmail(email);

        var existingSubscriber = newsletterRepository.findByEmail(cleanEmail);
        
        if (existingSubscriber.isPresent()) {
            NewsletterSubscriber subscriber = existingSubscriber.get();
            if (!subscriber.getIsActive()) {
                subscriber.setIsActive(true);
                subscriber.setLanguage(resolverLangCode(language));
                return newsletterRepository.save(subscriber);
            }
            throw new RuntimeException("This email is already subscribed to the newsletter.");
        }

        NewsletterSubscriber newSubscriber = new NewsletterSubscriber();
        newSubscriber.setEmail(cleanEmail);
        newSubscriber.setIsActive(true);
        newSubscriber.setLanguage(resolverLangCode(language));

        return newsletterRepository.save(newSubscriber);
    }

    public void unsubscribe(String email) {
        String cleanEmail = sanitizeEmail(email);
        
        NewsletterSubscriber subscriber = newsletterRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("The email is not registered in the newsletter."));

        subscriber.setIsActive(false);
        newsletterRepository.save(subscriber);
    }

    private String sanitizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("The email is required.");
        }
        
        String cleanEmail = Sanitizer.requireClean("email", email).toLowerCase().trim();
        
        if (!cleanEmail.contains("@") || !cleanEmail.contains(".")) {
            throw new RuntimeException("The email format is not valid.");
        }

        String domain = cleanEmail.substring(cleanEmail.lastIndexOf("@") + 1);

        if (domain.isBlank() || !domain.contains(".")) {
            throw new RuntimeException("The email domain is not valid.");
        }

        List<String> allowedDomains = List.of(
            "gmail.com", 
            "hotmail.com", 
            "outlook.com",
            "ucr.ac.cr"
        );

        if (!allowedDomains.contains(domain)) {
            throw new RuntimeException("Only common email providers are allowed (Gmail, Hotmail, Outlook, etc).");
        }

        return cleanEmail;
    }

    private String resolverLangCode(String lang) {
        if (lang == null || lang.isBlank()) {
            return "es";
        }
        String normalized = lang.toLowerCase().trim();
        if (normalized.startsWith("en")) return "en";
        if (normalized.startsWith("fr")) return "fr";
        return "es";
    }
}