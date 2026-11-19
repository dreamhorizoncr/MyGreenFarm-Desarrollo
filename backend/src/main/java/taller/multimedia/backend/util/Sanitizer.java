package taller.multimedia.backend.util;

import java.util.regex.Pattern;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.parser.Parser;
import org.jsoup.safety.Safelist;

import taller.multimedia.backend.exception.InvalidFieldException;

/**
 * Cleans text typed by users before it is stored, to prevent stored XSS: HTML is removed and
 * control characters are dropped. Fields that must not contain HTML are rejected instead of
 * silently changed.
 */
public final class Sanitizer {

    private static final int MAX_PASSES = 5;
    private static final int MAX_FILE_NAME_LENGTH = 150;
    private static final String DEFAULT_FILE_NAME = "file";
    private static final Document.OutputSettings NO_PRETTY_PRINT = new Document.OutputSettings().prettyPrint(false);
    private static final Pattern SUSPICIOUS = Pattern.compile("<[a-zA-Z/!?]|[\\p{Cntrl}&&[^\\s]]");
    private static final Pattern RESERVED_FILE_NAME_CHARS = Pattern.compile("[\\p{Cf}\\\\/:*?\"<>|]");

    private Sanitizer() {
    }

    /**
     * @param input text to check, may be {@code null}
     * @return whether it contains something that looks like an HTML tag or a control character
     */
    public static boolean hasMaliciousContent(String input) {
        return input != null && SUSPICIOUS.matcher(input).find();
    }

    /**
     * @param field field name, used in the error
     * @param value text typed by the user
     * @return the text without HTML and with its whitespace collapsed to single spaces
     * @throws InvalidFieldException if the text contains HTML or control characters
     */
    public static String requireClean(String field, String value) {
        if (hasMaliciousContent(value)) {
            throw new InvalidFieldException(field, "The field " + field + " contains characters that are not allowed");
        }
        return text(value);
    }

    /**
     * @param field field name, used in the error
     * @param value text typed by the user, may be {@code null}
     * @return the trimmed text with its line breaks normalized to {@code \n}
     * @throws InvalidFieldException if the text contains HTML or control characters
     */
    public static String requireCleanPreserveLineBreaks(String field, String value) {
        if (hasMaliciousContent(value)) {
            throw new InvalidFieldException(field, "The field " + field + " contains characters that are not allowed");
        }
        if (value == null) {
            return null;
        }
        return value.replace("\r\n", "\n").replace('\r', '\n').trim();
    }

    /**
     * @param original name of an uploaded file, may contain a path
     * @return a safe name: no path, no reserved or invisible characters, at most 150 characters
     *     before an alphanumeric extension, or {@code file} if nothing is left
     */
    public static String safeFileName(String original) {
        String name = text(original == null ? "" : original);
        int lastSeparator = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        name = name.substring(lastSeparator + 1);

        int dot = name.lastIndexOf('.');
        String base = dot >= 0 ? name.substring(0, dot) : name;
        String extension = dot >= 0 ? name.substring(dot + 1) : "";

        base = RESERVED_FILE_NAME_CHARS.matcher(base).replaceAll("");
        base = text(base);
        base = base.codePoints().limit(MAX_FILE_NAME_LENGTH)
                .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
                .toString().trim();

        if (base.isEmpty()) {
            base = DEFAULT_FILE_NAME;
        }

        extension = extension.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        return extension.isEmpty() ? base : base + "." + extension;
    }

    /**
     * Removes HTML repeatedly (up to five passes, to undo nested encodings) and collapses
     * whitespace.
     *
     * @param input text, may be {@code null}
     * @return the plain text
     */
    public static String text(String input) {
        if (input == null) {
            return null;
        }
        String current = input;
        for (int i = 0; i < MAX_PASSES; i++) {
            String next = cleanOnePass(current);
            if (next.equals(current)) {
                break;
            }
            current = next;
        }
        return normalizeWhitespace(current);
    }

    private static String cleanOnePass(String text) {
        String withoutHtml = Jsoup.clean(text, "", Safelist.none(), NO_PRETTY_PRINT);
        return Parser.unescapeEntities(withoutHtml, false);
    }

    private static String normalizeWhitespace(String text) {
        return text
                .replaceAll("[\\p{Cntrl}&&[^\\s]]", "")
                .replaceAll("[\\s\\p{Z}]+", " ")
                .trim();
    }
}
