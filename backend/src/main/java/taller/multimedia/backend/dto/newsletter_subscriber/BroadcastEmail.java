package taller.multimedia.backend.dto.newsletter_subscriber;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class BroadcastEmail {
    @NotBlank(message = "The subject is required")
    private String subject;

    @NotBlank(message = "The message is required")
    private String message;

    @NotNull (message = "The audience type is required (PARENTS, SUBSCRIBERS, BOTH)")
    private AudienceType audienceType;

    private String language;

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public AudienceType getAudienceType() {
        return audienceType;
    }

    public void setAudienceType(AudienceType audienceType) {
        this.audienceType = audienceType;
    }
}
