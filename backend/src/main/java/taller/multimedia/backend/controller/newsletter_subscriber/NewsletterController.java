package taller.multimedia.backend.controller.newsletter_subscriber;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import taller.multimedia.backend.dto.newsletter_subscriber.BroadcastEmail;
import taller.multimedia.backend.dto.newsletter_subscriber.SubscriberInfo;
import taller.multimedia.backend.model.newsletter_subscriber.NewsletterSubscriber;
import taller.multimedia.backend.repository.newsletter_subscriber.NewsletterSubscriberRepository;
import taller.multimedia.backend.service.newsletter_subscriber.BroadcastService;
import taller.multimedia.backend.service.newsletter_subscriber.NewsletterService;

@RestController
@RequestMapping("/api/newsletter")
public class NewsletterController {

    private final NewsletterSubscriberRepository newsletterRepository;
    private final BroadcastService broadcastService;
    private final NewsletterService newsletterService;

    public NewsletterController(NewsletterSubscriberRepository newsletterRepository,
                                BroadcastService broadcastService,
                                NewsletterService newsletterService) {
        this.newsletterRepository = newsletterRepository;
        this.broadcastService = broadcastService;
        this.newsletterService = newsletterService;
    }

    // Endpoint para que los usuarios se suscriban desde la nueva sección
    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@Valid @RequestBody SubscriberInfo dto) {
        try {
            // Delegamos toda la lógica, limpieza y validación al servicio
            NewsletterSubscriber saved = newsletterService.subscribe(dto.getEmail(), dto.getLanguage());
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // Endpoint para no recibir más correos
    @DeleteMapping("/unsubscribe")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<String> unsubscribe(@RequestParam String email) {
        try {
            newsletterService.unsubscribe(email);
            return ResponseEntity.ok("Te has desuscrito exitosamente del boletín.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // Endpoint para disparar el envío masivo
    @PostMapping("/broadcast")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<String> sendBroadcast(@Valid @RequestBody BroadcastEmail dto) {
        try {
            broadcastService.sendBroadcast(dto);
            return ResponseEntity.ok("Correo masivo enviado exitosamente a la audiencia: " + dto.getAudienceType());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al enviar correos: " + e.getMessage());
        }
    }
}