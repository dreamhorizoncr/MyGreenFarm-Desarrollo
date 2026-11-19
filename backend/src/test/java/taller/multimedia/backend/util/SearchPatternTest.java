package taller.multimedia.backend.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SearchPatternTest {

    @Test
    void blankTextMeansNoSearch() {
        assertThat(SearchPattern.of(null)).isEmpty();
        assertThat(SearchPattern.of("   ")).isEmpty();
    }

    @Test
    void textIsTrimmedLowerCasedAndWrappedForLike() {
        assertThat(SearchPattern.of("  Ana PÉREZ ")).contains("%ana pérez%");
    }

    @Test
    void likeWildcardsTypedByTheUserAreSearchedLiterally() {
        assertThat(SearchPattern.of("50%_a\\b")).contains("%50\\%\\_a\\\\b%");
    }

    @Test
    void veryLongTextIsCut() {
        assertThat(SearchPattern.of("x".repeat(500)).orElseThrow()).hasSize(SearchPattern.MAX_LENGTH + 2);
    }
}
