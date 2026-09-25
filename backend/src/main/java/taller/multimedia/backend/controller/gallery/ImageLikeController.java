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

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.gallery.ImageLikeResponse;
import taller.multimedia.backend.service.gallery.ImageLikeService;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/api/gallery/likes")
@RequiredArgsConstructor
public class ImageLikeController {

    private final ImageLikeService imageLikeService;

    @PostMapping("/{imageId}")
    public ResponseEntity<ImageLikeResponse> react(@PathVariable UUID imageId,
            @CurrentSecurityContext SecurityContext context,
            @CookieValue(name = "anon_id", required = false) String anonId,
            HttpServletResponse response) {

        if (!(context.getAuthentication() instanceof AnonymousAuthenticationToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (anonId == null) {
            anonId = UUID.randomUUID().toString();
            Cookie cookie = new Cookie("anon_id", anonId);
            cookie.setHttpOnly(true);
            cookie.setMaxAge(60 * 60 * 24 * 365);
            cookie.setPath("/");
            response.addCookie(cookie);
        }

        ImageLikeResponse result = imageLikeService.toggleLike(imageId, anonId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/mine")
    public ResponseEntity<List<UUID>> myLikes(@CookieValue(name = "anon_id", required = false) String anonId) {
        if (anonId == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(imageLikeService.findLikedImageIds(anonId));
    }
    
}
