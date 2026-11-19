package taller.multimedia.backend.controller.gallery;

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
import taller.multimedia.backend.dto.gallery.ImageLikeResponse;
import taller.multimedia.backend.controller.common.AnonymousVisitor;
import taller.multimedia.backend.service.gallery.ImageLikeService;

/**
 * Likes on gallery images from anonymous visitors, identified by the {@code anon_id} cookie.
 */
@RestController
@RequestMapping("/api/gallery/likes")
@RequiredArgsConstructor
public class ImageLikeController {

    private final ImageLikeService imageLikeService;

    /**
     * {@code POST /api/gallery/likes/{imageId}}: adds or removes the visitor's like. Signed-in
     * staff may not like images.
     *
     * @param imageId gallery image
     * @param context security context, to reject signed-in users
     * @param anonId visitor ID from the cookie; created when missing
     * @param response response, to set the cookie
     * @return the image's likes and whether the visitor likes it, or 403 for signed-in users
     */
    @PostMapping("/{imageId}")
    public ResponseEntity<ImageLikeResponse> react(@PathVariable UUID imageId,
            @CurrentSecurityContext SecurityContext context,
            @CookieValue(name = AnonymousVisitor.COOKIE_NAME, required = false) String anonId,
            HttpServletResponse response) {

        if (!(context.getAuthentication() instanceof AnonymousAuthenticationToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        anonId = AnonymousVisitor.ensureId(anonId, response);

        ImageLikeResponse result = imageLikeService.toggleLike(imageId, anonId);
        return ResponseEntity.ok(result);
    }

    /**
     * {@code GET /api/gallery/likes/mine}
     *
     * @param anonId visitor ID from the cookie, may be missing
     * @return IDs of the images the visitor likes, or an empty list
     */
    @GetMapping("/mine")
    public ResponseEntity<List<UUID>> myLikes(@CookieValue(name = AnonymousVisitor.COOKIE_NAME, required = false) String anonId) {
        if (anonId == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(imageLikeService.findLikedImageIds(anonId));
    }
    
}
