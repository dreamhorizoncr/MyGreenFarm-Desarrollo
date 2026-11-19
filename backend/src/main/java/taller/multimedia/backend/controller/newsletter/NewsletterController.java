package taller.multimedia.backend.controller.newsletter;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import taller.multimedia.backend.dto.newsletter.BroadcastEmail;
import taller.multimedia.backend.dto.newsletter.SubscriberInfo;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.newsletter.NewsletterSubscriber;
import taller.multimedia.backend.repository.newsletter.NewsletterSubscriberRepository;
import taller.multimedia.backend.repository.parent.ParentRepository;
import taller.multimedia.backend.service.newsletter.BroadcastService;
import taller.multimedia.backend.service.newsletter.NewsletterService;

/**
 * Newsletter. Visitors may subscribe; listing recipients, unsubscribing and sending are for the
 * owner.
 */
@RestController
@RequestMapping("/api/newsletter")
public class NewsletterController {

    private final NewsletterSubscriberRepository newsletterRepository;
    private final ParentRepository parentRepository;
    private final BroadcastService broadcastService;
    private final NewsletterService newsletterService;

    public NewsletterController(NewsletterSubscriberRepository newsletterRepository,
                                ParentRepository parentRepository,
                                BroadcastService broadcastService,
                                NewsletterService newsletterService) {
        this.newsletterRepository = newsletterRepository;
        this.parentRepository = parentRepository;
        this.broadcastService = broadcastService;
        this.newsletterService = newsletterService;
    }

    /**
     * {@code GET /api/newsletter/subscribers}
     *
     * @return emails of the active subscribers
     */
    @GetMapping("/subscribers")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<List<String>> getSubscriberEmails() {
        return ResponseEntity.ok(newsletterRepository.findAllActiveSubscriberEmails());
    }

    /**
     * {@code GET /api/newsletter/parents}
     *
     * @return emails of the active parents
     */
    @GetMapping("/parents")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<List<String>> getParentEmails() {
        return ResponseEntity.ok(parentRepository.findAllActiveParentEmails());
    }

    /**
     * {@code POST /api/newsletter/subscribe}
     *
     * @param request email and preferred language
     * @return 201 with the subscriber, or 400 with the reason if the email is not accepted
     */
    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@Valid @RequestBody SubscriberInfo request) {
        try {
            NewsletterSubscriber saved = newsletterService.subscribe(request.getEmail(), request.getLanguage());
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    /**
     * {@code DELETE /api/newsletter/unsubscribe}
     *
     * @param email subscribed email
     * @return a confirmation, or 404 with the reason
     */
    @DeleteMapping("/unsubscribe")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<String> unsubscribe(@RequestParam String email) {
        try {
            newsletterService.unsubscribe(email);
            return ResponseEntity.ok("You have successfully unsubscribed from the newsletter.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    /**
     * {@code POST /api/newsletter/broadcast}: emails a message to subscribers, parents or both, in
     * each recipient's language.
     *
     * @param request subject, message and audience
     * @return a confirmation, 400 if the content is unsafe, or 500 if sending failed
     */
    @PostMapping("/broadcast")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<String> sendBroadcast(@Valid @RequestBody BroadcastEmail request) {
        try {
            broadcastService.sendBroadcast(request);
            return ResponseEntity.ok("Bulk email sent successfully to audience: " + request.getAudienceType());
        } catch (InvalidFieldException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error sending emails: " + e.getMessage());
        }
    }
}