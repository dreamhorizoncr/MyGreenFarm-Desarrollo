package taller.multimedia.backend.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Hashing helpers.
 */
public final class HashUtils {

    private HashUtils() {
    }

    /**
     * Used to detect whether a text changed, for example before regenerating an AI summary or a
     * translation.
     *
     * @param content text to hash, in UTF-8
     * @return the SHA-256 hash in lowercase hexadecimal
     */
    public static String sha256(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(content.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder();
            for (byte currentByte : hashBytes) {
                hex.append(String.format("%02x", currentByte));
            }

            return hex.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}
