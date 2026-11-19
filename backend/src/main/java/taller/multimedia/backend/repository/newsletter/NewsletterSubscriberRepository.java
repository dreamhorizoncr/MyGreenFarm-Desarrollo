package taller.multimedia.backend.repository.newsletter;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import taller.multimedia.backend.model.newsletter.NewsletterSubscriber;

/**
 * Storage of newsletter subscribers.
 */
public interface NewsletterSubscriberRepository extends JpaRepository<NewsletterSubscriber, Integer> {
    /**
     * @return emails of the active subscribers
     */
    @Query("SELECT s.email FROM NewsletterSubscriber s WHERE s.isActive = true")
    List<String> findAllActiveSubscriberEmails();

    boolean existsByEmailAndIsActiveTrue(String email);

    /**
     * @return email and language of the active subscribers
     */
    @Query("SELECT s.email as email, s.language as language FROM NewsletterSubscriber s WHERE s.isActive = true")
    List<SubscriberEmailProjection> findAllActiveSubscribersInfo();

    Optional<NewsletterSubscriber> findByEmail(String email);
}
