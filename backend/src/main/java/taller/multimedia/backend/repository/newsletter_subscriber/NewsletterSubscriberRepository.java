package taller.multimedia.backend.repository.newsletter_subscriber;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.newsletter_subscriber.NewsletterSubscriber;

@Repository
public interface NewsletterSubscriberRepository extends JpaRepository<NewsletterSubscriber, Integer> {
    @Query("SELECT s.email FROM NewsletterSubscriber s WHERE s.isActive = true")
    List<String> findAllActiveSubscriberEmails();

    boolean existsByEmailAndIsActiveTrue(String email);

    @Query("SELECT s.email as email, s.language as language FROM NewsletterSubscriber s WHERE s.isActive = true")
    List<SubscriberEmailProjection> findAllActiveSubscribersInfo();

    @Query(value = """
            SELECT email, language FROM newsletter_subscribers WHERE is_active = true
            UNION
            SELECT email, language FROM parents
            """, nativeQuery = true)
    List<SubscriberEmailProjection> findAllUniqueSubscribersInfoForBroadcast();

    Optional<NewsletterSubscriber> findByEmail(String email);
}
