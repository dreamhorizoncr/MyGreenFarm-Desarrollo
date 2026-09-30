package taller.multimedia.backend.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class SanitizerTest {

    private static final Pattern TAG = Pattern.compile("<[a-zA-Z/!]");

    @Test
    void removesScriptAndItsContent() {
        assertEquals("", Sanitizer.text("<script>alert(1)</script>"));
        assertEquals("Hola", Sanitizer.text("Hola<script>alert(1)</script>"));
    }

    @Test
    void removesDangerousAttributesLikeOnerror() {
        assertEquals("", Sanitizer.text("<img src=x onerror=alert(1)>"));
        assertEquals("clic aquí", Sanitizer.text("<a href=\"javascript:alert(1)\" onclick=\"x()\">clic aquí</a>"));
    }

    @Test
    void keepsTextFromFormattingTags() {
        assertEquals("Hola mundo", Sanitizer.text("<b>Hola</b> <i>mundo</i>"));
    }

    @Test
    void keepsAccentsNsAndEmojis() {
        assertEquals("Ñandú, José y María 🌱🐣", Sanitizer.text("Ñandú, José y María 🌱🐣"));
        assertEquals("Educación inicial — niños", Sanitizer.text("  Educación inicial — niños  "));
    }

    @Test
    void trimsAndCollapsesSpacesTabsAndNewlines() {
        assertEquals("a b c", Sanitizer.text("   a    b\t\tc \n\n "));
        assertEquals("a b", Sanitizer.text("a  b"));
    }

    @Test
    void removesControlCharsButNotSpaces() {
        assertEquals("ab", Sanitizer.text("a\u0000b"));
    }

    @Test
    void handlesNullAndBlank() {
        assertNull(Sanitizer.text(null));
        assertEquals("", Sanitizer.text(""));
        assertEquals("", Sanitizer.text("     "));
        assertEquals("", Sanitizer.text("\t\n "));
    }

    @Test
    void doesNotLeaveEscapedEntitiesInNormalText() {
        assertEquals("Tom & Jerry", Sanitizer.text("Tom & Jerry"));
        assertEquals("Tom & Jerry", Sanitizer.text("Tom &amp; Jerry"));
        assertEquals("5 < 6 y 7 > 3", Sanitizer.text("5 < 6 y 7 > 3"));
    }

    @Test
    void isIdempotent() {
        String once = Sanitizer.text("  <b>Hola</b> &amp; adiós  ");
        assertEquals(once, Sanitizer.text(once));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "<script>alert(1)</script>",
            "<<script>script>alert(1)<</script>/script>",
            "&lt;script&gt;alert(1)&lt;/script&gt;",
            "&amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;",
            "<img src=x onerror=alert(1)>",
            "<svg/onload=alert(1)>",
            "<iframe src=\"javascript:alert(1)\"></iframe>",
            "<body onload=alert(1)>",
            "<!-- comentario --><b>x</b>",
            "<scr<script>ipt>alert(1)</scr</script>ipt>"
    })
    void noMaliciousInputLeavesHtmlTags(String malicious) {
        String result = Sanitizer.text(malicious);
        assertFalse(TAG.matcher(result).find(), "Quedó HTML en: " + result);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "Niños < 3 años",
            "Precio > 5000 colones",
            "Mamá & Papá",
            "Horario: 7am -> 5pm",
            "Me encanta <3",
            "Correo: ana@ucr.ac.cr",
            "Dirección: 100 m al norte de la iglesia, casa #4"
    })
    void legitimateTextIsNotLostOrDistorted(String legitimate) {
        assertEquals(legitimate, Sanitizer.text(legitimate));
    }

    @Test
    void knownLimitation_lessThanGluedToALetterIsTreatedAsATag() {
        assertEquals("x", Sanitizer.text("x<y"));
        assertEquals("Ana", Sanitizer.text("Ana <ana@ucr.ac.cr>"));
        assertEquals("Tom", Sanitizer.text("Tom<Jerry>"));
    }

    @Test
    void veryLongTextDoesNotBreak() {
        String longText = "a".repeat(6000);
        assertEquals(6000, Sanitizer.text(longText).length());
    }
}
