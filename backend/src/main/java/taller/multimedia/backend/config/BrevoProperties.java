package taller.multimedia.backend.config;

/**
 * Brevo API key and the sender used for every email.
 */
public class BrevoProperties {
    private final String apiKey;
    private final String senderEmail;
    private final String senderName;

    /**
     * @param apiKey Brevo API key
     * @param senderEmail address the emails are sent from
     * @param senderName name shown as the sender
     */
    public BrevoProperties(String apiKey, String senderEmail, String senderName) {
        this.apiKey = apiKey;
        this.senderEmail = senderEmail;
        this.senderName = senderName;
    }

    public String getApiKey() { return apiKey; }
    public String getSenderEmail() { return senderEmail; }
    public String getSenderName() { return senderName; }
}
