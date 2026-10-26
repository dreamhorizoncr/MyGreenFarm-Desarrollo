package taller.multimedia.backend.util;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class ProfanityFilterTest {
    @Test void matchesWholeProfanityWordsAndNotSubstrings() {
        assertFalse(ProfanityFilter.containsProfanity("computadora reputación disputa diputado Vergara"));
        assertTrue(ProfanityFilter.containsProfanity("Qué cabrón"));
        assertTrue(ProfanityFilter.containsProfanity("imbéciles"));
        assertTrue(ProfanityFilter.containsProfanity("estupida"));
        assertTrue(ProfanityFilter.containsProfanity("coño"));
        assertFalse(ProfanityFilter.containsProfanity("cono"));
    }
}
