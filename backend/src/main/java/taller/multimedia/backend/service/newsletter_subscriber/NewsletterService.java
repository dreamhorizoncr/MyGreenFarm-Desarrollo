package taller.multimedia.backend.service.newsletter_subscriber;

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

    // Método para suscribir un nuevo correo
    public NewsletterSubscriber subscribe(String email, String language) {
        String cleanEmail = sanitizeEmail(email);

        var existingSubscriber = newsletterRepository.findByEmail(cleanEmail);
        
        if (existingSubscriber.isPresent()) {
            NewsletterSubscriber subscriber = existingSubscriber.get();
            // Si ya existía pero estaba inactivo, lo reactivamos
            if (!subscriber.getIsActive()) {
                subscriber.setIsActive(true);
                subscriber.setLanguage(resolverLangCode(language));
                return newsletterRepository.save(subscriber);
            }
            throw new RuntimeException("Este correo ya se encuentra suscrito activamente al boletín.");
        }

        // Si es nuevo, lo creamos
        NewsletterSubscriber newSubscriber = new NewsletterSubscriber();
        newSubscriber.setEmail(cleanEmail);
        newSubscriber.setIsActive(true);
        newSubscriber.setLanguage(resolverLangCode(language));

        return newsletterRepository.save(newSubscriber);
    }

    // Método para desuscribir
    public void unsubscribe(String email) {
        String cleanEmail = sanitizeEmail(email);
        
        NewsletterSubscriber subscriber = newsletterRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("El correo no se encuentra registrado en el boletín."));

        subscriber.setIsActive(false);
        newsletterRepository.save(subscriber);
    }

    private String sanitizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("El correo electrónico es obligatorio.");
        }
        
        String cleanEmail = email.toLowerCase().trim();
        
        if (!cleanEmail.contains("@") || !cleanEmail.contains(".")) {
            throw new RuntimeException("El formato del correo electrónico no es válido.");
        }

        String domain = cleanEmail.substring(cleanEmail.lastIndexOf("@") + 1);

        if (domain.isBlank() || !domain.contains(".")) {
            throw new RuntimeException("El dominio del correo no es válido.");
        }

        // Lista blanca de proveedores comunes (igual que en parents)
        List<String> allowedDomains = List.of(
            "gmail.com", 
            "hotmail.com", 
            "outlook.com",
            "ucr.ac.cr"
        );

        if (!allowedDomains.contains(domain)) {
            throw new RuntimeException("Solo se permiten correos de proveedores comunes (Gmail, Hotmail, Outlook, etc.).");
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