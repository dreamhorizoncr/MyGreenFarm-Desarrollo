package taller.multimedia.backend.service.newsletter;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import taller.multimedia.backend.dto.newsletter.BroadcastEmail;
import taller.multimedia.backend.repository.newsletter.NewsletterSubscriberRepository;
import taller.multimedia.backend.repository.newsletter.SubscriberEmailProjection;
import taller.multimedia.backend.repository.parent.ParentRepository;
import taller.multimedia.backend.service.email.EmailService;
import taller.multimedia.backend.util.Sanitizer;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Sends an email message to newsletter subscribers, parents or both.
 */
@Service
public class BroadcastService {

    private static final Logger log = LoggerFactory.getLogger(BroadcastService.class);

    private final NewsletterSubscriberRepository newsletterRepository;
    private final ParentRepository parentRepository;
    private final EmailService emailService;

    public BroadcastService(NewsletterSubscriberRepository newsletterRepository, ParentRepository parentRepository, EmailService emailService) {
        this.newsletterRepository = newsletterRepository;
        this.parentRepository = parentRepository;
        this.emailService = emailService;
    }

    /**
     * Sanitizes the message and emails it to every active recipient of the chosen audience.
     *
     * @param request subject, message (line breaks are kept) and audience
     * @throws taller.multimedia.backend.exception.InvalidFieldException if the subject or message is unsafe
     */
    public void sendBroadcast(BroadcastEmail request) {
        String subject = Sanitizer.requireClean("subject", request.getSubject());
        String message = Sanitizer.requireCleanPreserveLineBreaks("message", request.getMessage());

        List<SubscriberEmailProjection> recipients = new ArrayList<>();

        switch (request.getAudienceType()) {
            case PARENTS:
                recipients = parentRepository.findAllActiveParentsInfo();
                break;
            case SUBSCRIBERS:
                recipients = newsletterRepository.findAllActiveSubscribersInfo();
                break;
            case BOTH:
                recipients = getUniqueActiveRecipients();
                break;
        }

        log.info("Newsletter broadcast audience={} activeRecipients={}", request.getAudienceType(), recipients.size());
        emailService.sendBroadcastEmail(recipients, subject, message);
    }

    /**
     * @return active subscribers and parents together, without repeating an email address (compared
     *     ignoring case and surrounding spaces)
     */
    private List<SubscriberEmailProjection> getUniqueActiveRecipients() {
        Map<String, SubscriberEmailProjection> recipientsByEmail = new LinkedHashMap<>();
        newsletterRepository.findAllActiveSubscribersInfo().forEach(recipient ->
                recipientsByEmail.putIfAbsent(normalizeEmail(recipient.getEmail()), recipient));
        parentRepository.findAllActiveParentsInfo().forEach(recipient ->
                recipientsByEmail.putIfAbsent(normalizeEmail(recipient.getEmail()), recipient));
        return new ArrayList<>(recipientsByEmail.values());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
