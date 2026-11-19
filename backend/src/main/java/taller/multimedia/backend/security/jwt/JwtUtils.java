package taller.multimedia.backend.security.jwt;

import java.util.Date;

import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import taller.multimedia.backend.security.service.UserDetailsImpl;

/**
 * Creates and validates the JWTs used to sign in, signed with HMAC-SHA using {@code
 * mygreenfarm.app.jwtSecret} (Base64) and valid for {@code mygreenfarm.app.jwtExpirationMs}.
 */
@Component
public class JwtUtils {
  private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

  @Value("${mygreenfarm.app.jwtSecret}")
  private String jwtSecret;

  @Value("${mygreenfarm.app.jwtExpirationMs}")
  private int jwtExpirationMs;

  /**
   * @param userPrincipal authenticated user
   * @return a signed token for the user
   */
  public String generateJwtToken(UserDetailsImpl userPrincipal) {
    return generateTokenFromUsername(userPrincipal.getUsername());
  }

  /**
   * @param username user's email
   * @return a signed token whose subject is the email
   */
  public String generateTokenFromUsername(String username) {
    return Jwts.builder()
        .subject(username)
        .issuedAt(new Date())
        .expiration(new Date((new Date()).getTime() + jwtExpirationMs))
        .signWith(key())
        .compact();
  }

  /**
   * @param token valid token
   * @return the user's email stored in the token
   */
  public String getUserNameFromJwtToken(String token) {
    return Jwts.parser()
        .verifyWith(key())
        .build()
        .parseSignedClaims(token)
        .getPayload()
        .getSubject();
  }

  private SecretKey key() {
    return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
  }

  /**
   * @param userPrincipal authenticated user
   * @return an HTTP-only {@code jwt} cookie with a new token, valid as long as the token
   */
  public ResponseCookie generateJwtCookie(UserDetailsImpl userPrincipal) {
    return generateJwtCookie(generateJwtToken(userPrincipal));
  }

  /**
   * @param jwt token already generated for the user
   * @return an HTTP-only {@code jwt} cookie with the token, valid as long as the token
   */
  public ResponseCookie generateJwtCookie(String jwt) {
    return ResponseCookie.from("jwt", jwt)
        .path("/")
        .maxAge(jwtExpirationMs / 1000)
        .httpOnly(true)
        .secure(true)
        .sameSite("Lax")
        .build();
  }

  /**
   * @return an empty, expired {@code jwt} cookie that removes the session from the browser
   */
  public ResponseCookie getCleanJwtCookie() {
    return ResponseCookie.from("jwt", "")
        .path("/")
        .maxAge(0)
        .httpOnly(true)
        .secure(true)
        .sameSite("Lax")
        .build();
  }

  /**
   * @param authToken token sent by the client
   * @return {@code true} if the signature is valid, {@code false} if it is malformed, unsupported
   *     or empty
   * @throws ExpiredJwtException if the token expired, so the caller can report an expired session
   */
  public boolean validateJwtToken(String authToken) {
    try {
      Jwts.parser().verifyWith(key()).build().parse(authToken);
      return true;
    } catch (ExpiredJwtException e) {
      logger.error("Expired Token JWT: {}", e.getMessage());
      throw e;
    } catch (MalformedJwtException e) {
      logger.error("Invalid Token JWT: {}", e.getMessage());
    } catch (UnsupportedJwtException e) {
      logger.error("Token JWT not supported: {}", e.getMessage());
    } catch (IllegalArgumentException e) {
      logger.error("Claims JWT empty: {}", e.getMessage());
    }
    return false;
  }
}