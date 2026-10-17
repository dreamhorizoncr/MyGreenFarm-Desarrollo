package taller.multimedia.backend.i18n;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
public class BackendMessageTranslator {

    private static final String RESOURCE = "i18n/backend-messages.tsv";
    private static final List<String> LANGUAGES = List.of("es", "en", "fr");

    private record Entry(String source, String mode, Map<String, String> targets, Pattern pattern) {
    }

    private final Map<String, Entry> exact = new HashMap<>();
    private final List<Entry> prefixes = new ArrayList<>();
    private final List<Entry> templates = new ArrayList<>();

    public BackendMessageTranslator() {
        this(new ClassPathResource(RESOURCE));
    }

    BackendMessageTranslator(ClassPathResource resource) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            reader.lines().skip(1).filter(line -> !line.isBlank()).forEach(this::addLine);
        } catch (IOException exception) {
            throw new UncheckedIOException("No se pudo leer " + RESOURCE, exception);
        }
        prefixes.sort(Comparator.comparingInt((Entry entry) -> entry.source().length()).reversed());
    }

    private void addLine(String line) {
        String[] columns = line.split("\t", -1);
        if (columns.length < 5) return;
        Map<String, String> targets = Map.of("es", columns[2], "en", columns[3], "fr", columns[4]);
        String source = columns[0].trim();
        String mode = columns[1].trim();
        switch (mode) {
            case "exact" -> exact.put(source, new Entry(source, mode, targets, null));
            case "prefix", "replace" -> prefixes.add(new Entry(source, mode, targets, null));
            case "template" -> templates.add(new Entry(source, mode, targets, toPattern(source)));
            default -> { }
        }
    }

    private static Pattern toPattern(String source) {
        String[] parts = source.split("\\{\\}", -1);
        StringBuilder regex = new StringBuilder("^");
        for (int i = 0; i < parts.length; i++) {
            regex.append(Pattern.quote(parts[i]));
            if (i < parts.length - 1) regex.append("(.*?)");
        }
        return Pattern.compile(regex.append("$").toString(), Pattern.DOTALL);
    }

    public String translate(String message, Locale locale) {
        if (message == null || message.isBlank()) return message;
        String language = languageOf(locale);
        String single = translateSingle(message.trim(), language);
        if (single != null) return single;

        String[] sentences = message.trim().split("\\.\\s+");
        if (sentences.length < 2) return message;
        List<String> translated = new ArrayList<>();
        boolean anyTranslated = false;
        for (String sentence : sentences) {
            String part = translateSingle(sentence.trim(), language);
            if (part == null) part = translateSingle(sentence.trim() + ".", language);
            anyTranslated |= part != null;
            translated.add(stripPeriod(part != null ? part : sentence.trim()));
        }
        return anyTranslated ? String.join(". ", translated) : message;
    }

    private static String stripPeriod(String text) {
        return text.endsWith(".") ? text.substring(0, text.length() - 1) : text;
    }

    private String translateSingle(String trimmed, String language) {
        Entry entry = exact.get(trimmed);
        if (entry != null) return entry.targets().get(language);

        for (Entry template : templates) {
            Matcher matcher = template.pattern().matcher(trimmed);
            if (matcher.matches()) {
                String result = template.targets().get(language);
                for (int group = 1; group <= matcher.groupCount(); group++) {
                    result = result.replaceFirst(Pattern.quote("{}"), Matcher.quoteReplacement(matcher.group(group)));
                }
                return result;
            }
        }

        for (Entry prefix : prefixes) {
            if (trimmed.startsWith(prefix.source())) {
                String target = prefix.targets().get(language);
                if ("replace".equals(prefix.mode())) return target;
                return target + " " + trimmed.substring(prefix.source().length()).trim();
            }
        }

        return null;
    }

    static String languageOf(Locale locale) {
        String language = locale == null ? "es" : locale.getLanguage();
        return LANGUAGES.contains(language) ? language : "es";
    }
}
