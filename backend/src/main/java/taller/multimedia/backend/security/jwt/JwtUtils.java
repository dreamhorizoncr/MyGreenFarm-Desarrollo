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
import taller.multimedia.backend.security.services.UserDetailsImpl;

@Component
public class JwtUtils {
  private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

  @Value("${mygreenfarm.app.jwtSecret}")
  private String jwtSecret; // The secret key for signing the JWT tokens

  @Value("${mygreenfarm.app.jwtExpirationMs}")
  private int jwtExpirationMs;  // The expiration time for the JWT tokens in milliseconds

  public String generateJwtToken(UserDetailsImpl userPrincipal) {
    return generateTokenFromUsername(userPrincipal.getUsername());
  }

  // Generate a JWT token based on the provided username
  public String generateTokenFromUsername(String username) {
    return Jwts.builder()
        .subject(username)
        .issuedAt(new Date())
        .expiration(new Date((new Date()).getTime() + jwtExpirationMs))
        .signWith(key())
        .compact();
  }

  // Retrieve the username from the provided JWT token
  public String getUserNameFromJwtToken(String token) {
    return Jwts.parser()
        .verifyWith(key())
        .build()
        .parseSignedClaims(token)
        .getPayload()
        .getSubject();
  }

  // Validate the provided JWT token and return true if it is valid, false otherwise
  private SecretKey key() {
    return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
  }

  // Generate a JWT cookie for the authenticated user
  public ResponseCookie generateJwtCookie(UserDetailsImpl userPrincipal) {
    String jwt = generateJwtToken(userPrincipal);
    return ResponseCookie.from("jwt", jwt)
        .path("/")
        .maxAge(24 * 60 * 60)
        .httpOnly(true)
        .build();
  }

  // Generate a clean JWT cookie to clear the authentication token
  public ResponseCookie getCleanJwtCookie() {
    return ResponseCookie.from("jwt", "")
        .path("/")
        .maxAge(0)
        .httpOnly(true)
        .build();
  }

  // Validate the provided JWT token and return true if it is valid, false otherwise
  public boolean validateJwtToken(String authToken) {
    try {
      Jwts.parser().verifyWith(key()).build().parse(authToken);
      return true;
    } catch (MalformedJwtException e) {
      logger.error("Invalid Token JWT: {}", e.getMessage());
    } catch (ExpiredJwtException e) {
      logger.error("Expired Token JWT: {}", e.getMessage());
    } catch (UnsupportedJwtException e) {
      logger.error("Token JWT not supported: {}", e.getMessage());
    } catch (IllegalArgumentException e) {
      logger.error("Claims JWT empty: {}", e.getMessage());
    }
    return false;
  }
}