package taller.multimedia.backend.controller.forum;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.CurrentSecurityContext;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.forum.ForumArticleRequest;
import taller.multimedia.backend.dto.forum.ForumArticleResponse;
import taller.multimedia.backend.service.forum.ForumArticleService;
import taller.multimedia.backend.controller.common.AnonymousVisitor;
import taller.multimedia.backend.service.spelling.SpellingCorrectionAsyncService;

/**
 * Articles of the forum's blog. Visitors read them; the owner and teachers write them, and a
 * teacher may only change their own.
 */
@Validated
@RestController
@RequestMapping("/api/forum/articles")
@RequiredArgsConstructor
public class ForumArticleController {

    private final ForumArticleService articleService;
    private final SpellingCorrectionAsyncService spellingCorrectionAsyncService;

    /**
     * {@code GET /api/forum/articles}
     *
     * @param topic topic to filter by, optional
     * @param page page number, from 0
     * @param size page size, 1 to 10
     * @param anonId visitor ID from the cookie, to report which articles they liked
     * @return articles, newest first
     */
    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<Page<ForumArticleResponse>> getAll(
            @RequestParam(required = false) String topic,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(10) int size,
            @CookieValue(name = AnonymousVisitor.COOKIE_NAME, required = false) String anonId) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(articleService.getAll(topic, pageable, anonId));
    }

    /**
     * {@code GET /api/forum/articles/mine}, teachers only.
     *
     * @param page page number, from 0
     * @param size page size, 1 to 10
     * @param context current teacher
     * @param anonId visitor ID from the cookie, may be missing
     * @return the teacher's own articles
     */
    @GetMapping("/mine")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Page<ForumArticleResponse>> getMine(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(10) int size,
            @CurrentSecurityContext SecurityContext context,
            @CookieValue(name = AnonymousVisitor.COOKIE_NAME, required = false) String anonId) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(articleService.getMine(currentEmail(context), pageable, anonId));
    }

    /**
     * {@code GET /api/forum/articles/{id}}
     *
     * @param id article ID
     * @param anonId visitor ID from the cookie, may be missing
     * @return the article
     */
    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ForumArticleResponse> getById(
            @PathVariable UUID id,
            @CookieValue(name = AnonymousVisitor.COOKIE_NAME, required = false) String anonId) {
        return ResponseEntity.ok(articleService.getById(id, anonId));
    }

    /**
     * {@code POST /api/forum/articles}, multipart: publishes an article and corrects its spelling
     * and generates its AI summary in the background.
     *
     * @param request article data, in the {@code article} part
     * @param image optional image
     * @param context current user
     * @param anonId visitor ID from the cookie, may be missing
     * @return 201 with the published article
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'TEACHER')")
    public ResponseEntity<ForumArticleResponse> create(
            @RequestPart("article") @Valid ForumArticleRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @CurrentSecurityContext SecurityContext context,
            @CookieValue(name = AnonymousVisitor.COOKIE_NAME, required = false) String anonId) {
        ForumArticleResponse created = articleService.create(request, image, currentEmail(context), anonId);
        spellingCorrectionAsyncService.correctArticle(created.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * {@code PUT /api/forum/articles/{id}}, multipart.
     *
     * @param id article ID
     * @param request new data, in the {@code article} part
     * @param image new image, optional
     * @param context current user
     * @param anonId visitor ID from the cookie, may be missing
     * @return the updated article
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'TEACHER')")
    public ResponseEntity<ForumArticleResponse> update(
            @PathVariable UUID id,
            @RequestPart("article") @Valid ForumArticleRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @CurrentSecurityContext SecurityContext context,
            @CookieValue(name = AnonymousVisitor.COOKIE_NAME, required = false) String anonId) {
        ForumArticleResponse updated = articleService.update(
                id, request, image, currentEmail(context), anonId);
        spellingCorrectionAsyncService.correctArticle(updated.getId());
        return ResponseEntity.ok(updated);
    }

    /**
     * {@code DELETE /api/forum/articles/{id}}: deletes the article with its image, likes and
     * comments.
     *
     * @param id article ID
     * @param context current user
     * @return 204
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'TEACHER')")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @CurrentSecurityContext SecurityContext context) {
        articleService.delete(id, currentEmail(context));
        return ResponseEntity.noContent().build();
    }

    private String currentEmail(SecurityContext context) {
        return context.getAuthentication().getName();
    }
}
