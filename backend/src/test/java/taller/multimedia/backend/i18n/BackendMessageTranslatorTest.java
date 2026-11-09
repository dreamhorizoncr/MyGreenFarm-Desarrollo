package taller.multimedia.backend.i18n;

import java.util.Locale;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BackendMessageTranslatorTest {

    private final BackendMessageTranslator translator = new BackendMessageTranslator();
    private static final Locale EN = Locale.ENGLISH;
    private static final Locale FR = Locale.FRENCH;
    private static final Locale ES = Locale.forLanguageTag("es");

    @Test
    void exactMessages_areTranslatedToTheRequestLanguage() {
        assertThat(translator.translate("The title is required", ES)).isEqualTo("El título es obligatorio");
        assertThat(translator.translate("The title is required", FR)).isEqualTo("Le titre est obligatoire");
        assertThat(translator.translate("The title is required", EN)).isEqualTo("The title is required");
    }

    @Test
    void prefixMessages_keepTheVariablePart() {
        assertThat(translator.translate("A club already exists with the name: Robótica", ES))
                .isEqualTo("Ya existe un club con el nombre: Robótica");
    }

    @Test
    void technicalMessages_areReplacedByAFriendlyText() {
        assertThat(translator.translate("Error communicating with OnvoPay: timeout 504", ES))
                .isEqualTo("No se pudo conectar con OnvoPay. Inténtalo más tarde.");
        assertThat(translator.translate("Club not found with ID: 42", FR)).isEqualTo("Le club n'existe plus.");
    }

    @Test
    void templates_moveTheCapturedValueIntoTheTranslation() {
        assertThat(translator.translate("The club 'Arte' has no spots left.", ES))
                .isEqualTo("El club 'Arte' ya no tiene cupos disponibles.");
    }

    @Test
    void severalValidationMessages_areTranslatedOneByOne() {
        assertThat(translator.translate("The category is required. The content is required. The title is required", ES))
                .isEqualTo("La categoría es obligatoria. El contenido es obligatorio. El título es obligatorio");
    }

    @Test
    void unknownMessagesAndLanguages_areLeftAsTheyAre() {
        assertThat(translator.translate("Message that is not in the dictionary", ES)).isEqualTo("Message that is not in the dictionary");
        assertThat(translator.translate("The title is required", Locale.GERMAN)).isEqualTo("El título es obligatorio");
    }
}
