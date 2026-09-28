package taller.multimedia.backend.service.newsletter_subscriber;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import taller.multimedia.backend.dto.newsletter_subscriber.BroadcastEmail;
import taller.multimedia.backend.repository.newsletter_subscriber.NewsletterSubscriberRepository;
import taller.multimedia.backend.repository.newsletter_subscriber.SubscriberEmailProjection;
import taller.multimedia.backend.repository.parent.ParentRepository;
import taller.multimedia.backend.service.EmailService;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class BroadcastService {

    private static final Logger log = LoggerFactory.getLogger(BroadcastService.class);

    private final NewsletterSubscriberRepository newsletterRepository;
    private final ParentRepository parentRepository;
    private final EmailService emailService; // Tu servicio de envío de correos (JavaMailSender o similar)

    public BroadcastService(NewsletterSubscriberRepository newsletterRepository, ParentRepository parentRepository, EmailService emailService) {
        this.newsletterRepository = newsletterRepository;
        this.parentRepository = parentRepository;
        this.emailService = emailService;
    }

    public void sendBroadcast(BroadcastEmail dto) {
        List<SubscriberEmailProjection> recipients = new ArrayList<>();

        switch (dto.getAudienceType()) {
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

        log.info("Newsletter broadcast audience={} activeRecipients={}", dto.getAudienceType(), recipients.size());
        emailService.sendBroadcastEmail(recipients, dto.getSubject(), dto.getMessage());
    }

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
