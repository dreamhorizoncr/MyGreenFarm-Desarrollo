package taller.multimedia.backend.util;

import java.util.regex.Pattern;

public final class ProfanityFilter {
    private static final Pattern PROFANITY = Pattern.compile(
            "(?iU)\\b(?:mierda|put[ao]s?|cabr[oó]n(?:es)?|hijo\\s+de\\s+puta|hdp|pendej[oa]s?|idiotas?|imb[eé]cil(?:es)?|est[uú]pid[oa]s?|maldit[oa]s?|coño|joder|verg[ao]s?|gilipollas|maric[oó]n(?:es)?|zorras?|perras?|bastard[oa]s?|fuck|shit|bitch|assholes?|bastards?|dicks?|pussies|cunts?)\\b");

    private ProfanityFilter() { }

    public static boolean containsProfanity(String text) {
        return text != null && PROFANITY.matcher(text).find();
    }
}
