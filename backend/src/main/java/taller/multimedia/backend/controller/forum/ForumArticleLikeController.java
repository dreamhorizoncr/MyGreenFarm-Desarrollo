package taller.multimedia.backend.controller.forum;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.annotation.CurrentSecurityContext;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.forum.ForumArticleLikeResponse;
import taller.multimedia.backend.service.forum.ForumArticleLikeService;

@RestController
@RequestMapping("/api/forum/articles/likes")
@RequiredArgsConstructor
public class ForumArticleLikeController {

    private final ForumArticleLikeService likeService;

    @PostMapping("/{articleId}")
    public ResponseEntity<ForumArticleLikeResponse> react(
            @PathVariable UUID articleId,
            @CurrentSecurityContext SecurityContext context,
            @CookieValue(name = "anon_id", required = false) String anonId,
            HttpServletResponse response) {
        if (!(context.getAuthentication() instanceof AnonymousAuthenticationToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (anonId == null || anonId.isBlank()) {
            anonId = UUID.randomUUID().toString();
            Cookie cookie = new Cookie("anon_id", anonId);
            cookie.setHttpOnly(true);
            cookie.setMaxAge(60 * 60 * 24 * 365);
            cookie.setPath("/");
            response.addCookie(cookie);
        }

        return ResponseEntity.ok(likeService.toggleLike(articleId, anonId));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<UUID>> myLikes(
            @CookieValue(name = "anon_id", required = false) String anonId) {
        return ResponseEntity.ok(likeService.findLikedArticleIds(anonId));
    }
}
