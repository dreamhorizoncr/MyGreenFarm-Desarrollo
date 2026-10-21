package taller.multimedia.backend.util;

import java.util.List;

import org.junit.jupiter.api.Test;

import taller.multimedia.backend.exception.InvalidFieldException;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ImageAltTextTest {

    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    @Test
    void clean_storesBlankAsNullAndTrimsText() {
        assertThat(ImageAltText.clean("   ")).isNull();
        assertThat(ImageAltText.clean(null)).isNull();
        assertThat(ImageAltText.clean("  Niños jugando en el huerto  ")).isEqualTo("Niños jugando en el huerto");
    }

    @Test
    void clean_rejectsTextLongerThanTheLimit() {
        String tooLong = "a".repeat(ImageAltText.MAX_LENGTH + 1);

        assertThrows(InvalidFieldException.class, () -> ImageAltText.clean(tooLong));
    }

    @Test
    void clean_rejectsHtml() {
        assertThrows(InvalidFieldException.class, () -> ImageAltText.clean("<script>alert(1)</script>foto"));
    }

    @Test
    void parseList_keepsTextsWithCommasTogether() {
        List<String> alts = ImageAltText.parseList(objectMapper, "[\"Niños, maestras y familias\",\"Huerto escolar\"]");

        assertThat(alts).containsExactly("Niños, maestras y familias", "Huerto escolar");
    }

    @Test
    void parseList_treatsMissingValueAsEmptyAndRejectsInvalidJson() {
        assertThat(ImageAltText.parseList(objectMapper, null)).isEmpty();
        assertThrows(InvalidFieldException.class, () -> ImageAltText.parseList(objectMapper, "no es json"));
    }

    @Test
    void at_returnsNullWhenThereIsNoTextForThatImage() {
        assertThat(ImageAltText.at(List.of("Portada"), 0)).isEqualTo("Portada");
        assertThat(ImageAltText.at(List.of("Portada"), 1)).isNull();
        assertThat(ImageAltText.at(null, 0)).isNull();
    }
}
