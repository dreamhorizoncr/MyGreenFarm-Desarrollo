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
import taller.multimedia.backend.dto.forum.ForumPostLikeResponse;
import taller.multimedia.backend.controller.common.AnonymousVisitor;
import taller.multimedia.backend.service.forum.ForumPostLikeService;

/**
 * Likes on community posts from anonymous visitors, identified by the {@code anon_id} cookie.
 */
@RestController 
@RequestMapping ("/api/forum/posts/likes")
@RequiredArgsConstructor 
public class ForumPostLikeController {

    private final ForumPostLikeService postLikeService;

    /**
     * {@code POST /api/forum/posts/likes/{postId}}: adds or removes the visitor's like. Signed-in
     * staff may not like posts.
     *
     * @param postId community post
     * @param context security context, to reject signed-in users
     * @param anonId visitor ID from the cookie; created when missing
     * @param response response, to set the cookie
     * @return the post's likes and whether the visitor likes it, or 403 for signed-in users
     */
    @PostMapping ("/{postId}")
    public ResponseEntity<ForumPostLikeResponse> react(
            @PathVariable("postId") UUID postId,
            @CurrentSecurityContext SecurityContext context,
            @CookieValue(name = AnonymousVisitor.COOKIE_NAME, required = false) String anonId,
            HttpServletResponse response) {
        if (!(context.getAuthentication() instanceof AnonymousAuthenticationToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        anonId = AnonymousVisitor.ensureId(anonId, response);

        return ResponseEntity.ok(postLikeService.toggleLike(postId, anonId));
    }

    /**
     * {@code GET /api/forum/posts/likes/mine}
     *
     * @param anonId visitor ID from the cookie, may be missing
     * @return IDs of the posts the visitor likes
     */
    @GetMapping ("/mine")
    public ResponseEntity<List<UUID>> myLikes(
            @CookieValue(name = AnonymousVisitor.COOKIE_NAME, required = false) String anonId) {
        return ResponseEntity.ok(postLikeService.findLikedPostIds(anonId));
    }
}
