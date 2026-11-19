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

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.forum.ForumArticleLikeResponse;
import taller.multimedia.backend.controller.common.AnonymousVisitor;
import taller.multimedia.backend.service.forum.ForumArticleLikeService;

/**
 * Likes on forum articles from anonymous visitors, identified by the {@code anon_id} cookie.
 */
@RestController
@RequestMapping("/api/forum/articles/likes")
@RequiredArgsConstructor
public class ForumArticleLikeController {

    private final ForumArticleLikeService likeService;

    /**
     * {@code POST /api/forum/articles/likes/{articleId}}: adds or removes the visitor's like.
     * Signed-in staff may not like articles.
     *
     * @param articleId forum article
     * @param context security context, to reject signed-in users
     * @param anonId visitor ID from the cookie; created when missing
     * @param response response, to set the cookie
     * @return the article's likes and whether the visitor likes it, or 403 for signed-in users
     */
    @PostMapping("/{articleId}")
    public ResponseEntity<ForumArticleLikeResponse> react(
            @PathVariable UUID articleId,
            @CurrentSecurityContext SecurityContext context,
            @CookieValue(name = AnonymousVisitor.COOKIE_NAME, required = false) String anonId,
            HttpServletResponse response) {
        if (!(context.getAuthentication() instanceof AnonymousAuthenticationToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        anonId = AnonymousVisitor.ensureId(anonId, response);

        return ResponseEntity.ok(likeService.toggleLike(articleId, anonId));
    }

    /**
     * {@code GET /api/forum/articles/likes/mine}
     *
     * @param anonId visitor ID from the cookie, may be missing
     * @return IDs of the articles the visitor likes
     */
    @GetMapping("/mine")
    public ResponseEntity<List<UUID>> myLikes(
            @CookieValue(name = AnonymousVisitor.COOKIE_NAME, required = false) String anonId) {
        return ResponseEntity.ok(likeService.findLikedArticleIds(anonId));
    }
}
