package taller.multimedia.backend.util;

import java.util.Locale;
import java.util.Optional;

/**
 * Turns the text typed in a list's search box into a {@code LIKE} pattern for the repositories'
 * search queries, which use {@code ESCAPE '\'}.
 */
public final class SearchPattern {

    /** Longest search text taken into account; the rest is ignored. */
    public static final int MAX_LENGTH = 100;

    private SearchPattern() {
    }

    /**
     * @param search text typed by the user, may be {@code null}
     * @return {@code %text%} in lower case with {@code \}, {@code %} and {@code _} escaped, so they
     *     are searched literally; empty when there is nothing to search
     */
    public static Optional<String> of(String search) {
        if (search == null || search.isBlank()) {
            return Optional.empty();
        }
        String text = search.trim().toLowerCase(Locale.ROOT);
        if (text.length() > MAX_LENGTH) {
            text = text.substring(0, MAX_LENGTH);
        }
        String escaped = text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return Optional.of("%" + escaped + "%");
    }
}
