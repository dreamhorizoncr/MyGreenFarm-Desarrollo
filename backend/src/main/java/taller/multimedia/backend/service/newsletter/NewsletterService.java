package taller.multimedia.backend.service.newsletter;

import taller.multimedia.backend.util.Sanitizer;
import org.springframework.stereotype.Service;
import taller.multimedia.backend.model.newsletter.NewsletterSubscriber;
import taller.multimedia.backend.repository.newsletter.NewsletterSubscriberRepository;

import java.util.List;

/**
 * Newsletter subscriptions. Unsubscribing deactivates the subscriber instead of deleting it, so
 * subscribing again reactivates the same row.
 */
@Service 
public class NewsletterService {

    private final NewsletterSubscriberRepository newsletterRepository;

    public NewsletterService(NewsletterSubscriberRepository newsletterRepository) {
        this.newsletterRepository = newsletterRepository;
    }

    /**
     * Subscribes an email, or reactivates it if it had unsubscribed.
     *
     * @param email address to subscribe; it is sanitized and lowercased
     * @param language preferred language code; anything other than English or French becomes
     *     Spanish
     * @return the active subscriber
     * @throws RuntimeException if the email is invalid, not from an allowed provider, or already
     *     subscribed
     */
    public NewsletterSubscriber subscribe(String email, String language) {
        String cleanEmail = sanitizeEmail(email);

        var existingSubscriber = newsletterRepository.findByEmail(cleanEmail);
        
        if (existingSubscriber.isPresent()) {
            NewsletterSubscriber subscriber = existingSubscriber.get();
            if (!subscriber.getIsActive()) {
                subscriber.setIsActive(true);
                subscriber.setLanguage(resolveLanguageCode(language));
                return newsletterRepository.save(subscriber);
            }
            throw new RuntimeException("This email is already subscribed to the newsletter.");
        }

        NewsletterSubscriber newSubscriber = new NewsletterSubscriber();
        newSubscriber.setEmail(cleanEmail);
        newSubscriber.setIsActive(true);
        newSubscriber.setLanguage(resolveLanguageCode(language));

        return newsletterRepository.save(newSubscriber);
    }

    /**
     * Deactivates a subscription.
     *
     * @param email subscribed address
     * @throws RuntimeException if the email is invalid or not registered
     */
    public void unsubscribe(String email) {
        String cleanEmail = sanitizeEmail(email);
        
        NewsletterSubscriber subscriber = newsletterRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("The email is not registered in the newsletter."));

        subscriber.setIsActive(false);
        newsletterRepository.save(subscriber);
    }

    /**
     * Cleans an email and checks that it comes from an allowed provider (Gmail, Hotmail, Outlook or
     * UCR), to reduce fake or disposable subscriptions.
     *
     * @param email address entered by the visitor
     * @return the email in lowercase and without surrounding spaces
     * @throws RuntimeException if the email is missing, malformed or from another domain
     */
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

    /**
     * @param lang language code from the browser, for example {@code en-US}
     * @return {@code en}, {@code fr} or {@code es} (the default)
     */
    private String resolveLanguageCode(String lang) {
        if (lang == null || lang.isBlank()) {
            return "es";
        }
        String normalized = lang.toLowerCase().trim();
        if (normalized.startsWith("en")) return "en";
        if (normalized.startsWith("fr")) return "fr";
        return "es";
    }
}