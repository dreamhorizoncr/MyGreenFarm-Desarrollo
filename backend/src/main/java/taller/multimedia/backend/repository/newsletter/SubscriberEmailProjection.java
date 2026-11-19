package taller.multimedia.backend.repository.newsletter;

/**
 * Email and language of a newsletter recipient (subscriber or parent).
 */
public interface SubscriberEmailProjection {
    /**
     * @return recipient's email
     */
    String getEmail();
    /**
     * @return preferred language code, may be {@code null}
     */
    String getLanguage();
}
