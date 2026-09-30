package taller.multimedia.backend.util;

import java.util.regex.Pattern;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.parser.Parser;
import org.jsoup.safety.Safelist;

import taller.multimedia.backend.exception.InvalidFieldException;

public final class Sanitizer {

    private static final int MAX_PASSES = 5;
    private static final int MAX_FILE_NAME_LENGTH = 150;
    private static final String DEFAULT_FILE_NAME = "file";
    private static final Document.OutputSettings NO_PRETTY_PRINT = new Document.OutputSettings().prettyPrint(false);
    private static final Pattern SUSPICIOUS = Pattern.compile("<[a-zA-Z/!?]|[\\p{Cntrl}&&[^\\s]]");
    private static final Pattern RESERVED_FILE_NAME_CHARS = Pattern.compile("[\\p{Cf}\\\\/:*?\"<>|]");

    private Sanitizer() {
    }

    public static boolean hasMaliciousContent(String input) {
        return input != null && SUSPICIOUS.matcher(input).find();
    }

    // Rejects a field that contains HTML tags or control characters instead of silently stripping them.
    public static String requireClean(String field, String value) {
        if (hasMaliciousContent(value)) {
            throw new InvalidFieldException(field, "El campo " + field + " contiene caracteres no permitidos");
        }
        return text(value);
    }

    // Same rejection as requireClean, but keeps the line breaks the author typed instead of
    // collapsing them to a single space. Use this for long-form fields rendered with
    // white-space: pre-line / pre-wrap (news body, appointment notes, newsletter message).
    public static String requireCleanPreserveLineBreaks(String field, String value) {
        if (hasMaliciousContent(value)) {
            throw new InvalidFieldException(field, "El campo " + field + " contiene caracteres no permitidos");
        }
        if (value == null) {
            return null;
        }
        return value.replace("\r\n", "\n").replace('\r', '\n').trim();
    }

    // Makes an uploaded file's original name safe to store and display: strips any
    // directory portion, HTML/control characters and reserved filename characters,
    // and falls back to a default name when nothing legible is left.
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
