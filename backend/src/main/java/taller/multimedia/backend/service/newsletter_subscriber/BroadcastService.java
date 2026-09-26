package taller.multimedia.backend.service.newsletter_subscriber;

import org.springframework.stereotype.Service;

import taller.multimedia.backend.dto.newsletter_subscriber.BroadcastEmail;
import taller.multimedia.backend.repository.newsletter_subscriber.NewsletterSubscriberRepository;
import taller.multimedia.backend.repository.newsletter_subscriber.SubscriberEmailProjection;
import taller.multimedia.backend.repository.parent.ParentRepository;
import taller.multimedia.backend.service.EmailService;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class BroadcastService {

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
                recipients = parentRepository.findAllParentsInfo();
                break;
            case SUBSCRIBERS:
                recipients = newsletterRepository.findAllActiveSubscribersInfo();
                break;
            case BOTH:
                recipients = newsletterRepository.findAllUniqueSubscribersInfoForBroadcast();
                break;
        }

        emailService.sendBroadcastEmail(recipients, dto.getSubject(), dto.getMessage());
    }
}
