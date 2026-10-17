package taller.multimedia.backend.i18n;

import java.util.Locale;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BackendMessageTranslatorTest {

    private final BackendMessageTranslator translator = new BackendMessageTranslator();
    private static final Locale EN = Locale.ENGLISH;
    private static final Locale FR = Locale.FRENCH;

    @Test
    void exactMessages_areTranslatedToTheRequestLanguage() {
        assertThat(translator.translate("El título es obligatorio", EN)).isEqualTo("The title is required");
        assertThat(translator.translate("El título es obligatorio", FR)).isEqualTo("Le titre est obligatoire");
        assertThat(translator.translate("El título es obligatorio", Locale.forLanguageTag("es"))).isEqualTo("El título es obligatorio");
    }

    @Test
    void prefixMessages_keepTheVariablePart() {
        assertThat(translator.translate("Ya existe un club con el nombre: Robótica", EN))
                .isEqualTo("A club with this name already exists: Robótica");
    }

    @Test
    void technicalMessages_areReplacedByAFriendlyText() {
        assertThat(translator.translate("Error al comunicarse con OnvoPay: timeout 504", Locale.forLanguageTag("es")))
                .isEqualTo("No se pudo conectar con OnvoPay. Inténtalo más tarde.");
        assertThat(translator.translate("Club no encontrado con ID: 42", FR)).isEqualTo("Le club n'existe plus.");
    }

    @Test
    void templates_moveTheCapturedValueIntoTheTranslation() {
        assertThat(translator.translate("El club 'Arte' ya no tiene cupos disponibles.", EN))
                .isEqualTo("The club 'Arte' has no spots left.");
    }

    @Test
    void severalValidationMessages_areTranslatedOneByOne() {
        assertThat(translator.translate("La categoría es obligatoria. El contenido es obligatorio. El título es obligatorio", EN))
                .isEqualTo("The category is required. The content is required. The title is required");
    }

    @Test
    void unknownMessagesAndLanguages_areLeftAsTheyAre() {
        assertThat(translator.translate("Mensaje que no está en el diccionario", EN)).isEqualTo("Mensaje que no está en el diccionario");
        assertThat(translator.translate("El título es obligatorio", Locale.GERMAN)).isEqualTo("El título es obligatorio");
    }
}
