package taller.multimedia.backend.model.appointment;

/**
 * How a family heard about the center, with the label shown in Spanish.
 */
public enum ReferralSource {
    FRIEND("De un amigo o familiar"),
    SOCIAL_MEDIA("Redes sociales"),
    GOOGLE_SEARCH("Búsqueda en Google"),
    FLYER_OR_AD("Afiche o publicidad"),
    OTHER("Otro");

    private final String displayName;

    ReferralSource(String displayName) {
        this.displayName = displayName;
    }

    /**
     * @return label shown in the forms
     */
    public String getDisplayName() {
        return displayName;
    }
}
