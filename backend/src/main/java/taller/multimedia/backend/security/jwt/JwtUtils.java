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
  private String jwtSecret;

  @Value("${mygreenfarm.app.jwtExpirationMs}")
  private int jwtExpirationMs;

  public String generateJwtToken(UserDetailsImpl userPrincipal) {
    return generateTokenFromUsername(userPrincipal.getUsername());
  }

  public String generateTokenFromUsername(String username) {
    return Jwts.builder()
        .subject(username)
        .issuedAt(new Date())
        .expiration(new Date((new Date()).getTime() + jwtExpirationMs))
        .signWith(key())
        .compact();
  }

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

  public ResponseCookie generateJwtCookie(UserDetailsImpl userPrincipal) {
    String jwt = generateJwtToken(userPrincipal);
    return ResponseCookie.from("jwt", jwt)
        .path("/")
        .maxAge(jwtExpirationMs / 1000)
        .httpOnly(true)
        .build();
  }

  public ResponseCookie getCleanJwtCookie() {
    return ResponseCookie.from("jwt", "")
        .path("/")
        .maxAge(0)
        .httpOnly(true)
        .build();
  }

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