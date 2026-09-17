package taller.multimedia.backend.config;

public class BrevoProperties {
    private final String apiKey;
    private final String senderEmail;
    private final String senderName;

    public BrevoProperties(String apiKey, String senderEmail, String senderName) {
        this.apiKey = apiKey;
        this.senderEmail = senderEmail;
        this.senderName = senderName;
    }

    public String getApiKey() { return apiKey; }
    public String getSenderEmail() { return senderEmail; }
    public String getSenderName() { return senderName; }
}
