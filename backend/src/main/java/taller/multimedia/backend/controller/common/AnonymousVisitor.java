package taller.multimedia.backend.controller.common;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

import java.util.UUID;

/**
 * Identifies visitors without an account (for likes) with a random ID kept in an HTTP-only
 * cookie (Secure, SameSite=Lax) for one year. The ID is not linked to any personal data.
 */
public final class AnonymousVisitor {

    /** Name of the cookie that stores the visitor's ID. */
    public static final String COOKIE_NAME = "anon_id";

    private static final int COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

    private AnonymousVisitor() {
    }

    /**
     * Returns the visitor's ID, creating it and adding its cookie to the response when the
     * visitor does not have one yet.
     *
     * @param currentId ID read from the cookie, may be {@code null} or blank
     * @param response response that receives the new cookie
     * @return the existing or new visitor ID
     */
    public static String ensureId(String currentId, HttpServletResponse response) {
        if (currentId != null && !currentId.isBlank()) {
            return currentId;
        }
        String newId = UUID.randomUUID().toString();
        Cookie cookie = new Cookie(COOKIE_NAME, newId);
        cookie.setHttpOnly(true);
        cookie.setMaxAge(COOKIE_MAX_AGE_SECONDS);
        cookie.setPath("/");
        cookie.setSecure(true);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
        return newId;
    }
}
