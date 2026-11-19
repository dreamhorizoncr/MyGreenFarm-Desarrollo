package taller.multimedia.backend.dto.newsletter;

/**
 * Email and preferred language of someone subscribing to the newsletter.
 */
public class SubscriberInfo {
    private String email;
    private String language;

    public SubscriberInfo(String email, String language) {
        this.email = email;
        this.language = language;
    }

    public String getEmail() {
        return email;
    }

    public String getLanguage() {
        return language;
    }
}
