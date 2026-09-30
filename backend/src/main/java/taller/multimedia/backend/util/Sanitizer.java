package taller.multimedia.backend.util;

import java.util.regex.Pattern;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.parser.Parser;
import org.jsoup.safety.Safelist;

public final class Sanitizer {

    private static final int MAX_PASSES = 5;
    private static final Document.OutputSettings NO_PRETTY_PRINT = new Document.OutputSettings().prettyPrint(false);
    private static final Pattern SUSPICIOUS = Pattern.compile("<[a-zA-Z/!?]|[\\p{Cntrl}&&[^\\s]]");

    private Sanitizer() {
    }

    public static boolean hasMaliciousContent(String input) {
        return input != null && SUSPICIOUS.matcher(input).find();
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
