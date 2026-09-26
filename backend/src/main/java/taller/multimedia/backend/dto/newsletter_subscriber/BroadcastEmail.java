package taller.multimedia.backend.dto.newsletter_subscriber;

import jakarta.validation.constraints.NotBlank;

public class BroadcastEmail {
    @NotBlank(message = "El asunto es obligatorio")
    private String subject;

    @NotBlank(message = "El mensaje es obligatorio")
    private String message;

    @NotBlank(message = "El tipo de audiencia es obligatorio (PARENTS, SUBSCRIBERS, BOTH)")
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
