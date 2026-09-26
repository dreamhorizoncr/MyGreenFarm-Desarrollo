package taller.multimedia.backend.dto.newsletter_subscriber;

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
