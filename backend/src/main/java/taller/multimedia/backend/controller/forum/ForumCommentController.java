package taller.multimedia.backend.controller.forum;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.CurrentSecurityContext;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.forum.ForumCommentRequest;
import taller.multimedia.backend.dto.forum.ForumCommentResponse;
import taller.multimedia.backend.service.forum.ForumCommentService;

/**
 * Comments on forum articles. Visitors may read and publish them; only the owner may delete them.
 */
@Validated
@RestController
@RequestMapping("/api/forum/articles/{articleId}/comments")
@RequiredArgsConstructor
public class ForumCommentController {

    private final ForumCommentService commentService;

    /**
     * {@code GET /api/forum/articles/{articleId}/comments}
     *
     * @param articleId forum article
     * @param page page number, from 0
     * @param size page size, 1 to 10
     * @return the comments, newest first
     */
    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<Page<ForumCommentResponse>> getByArticle(
            @PathVariable UUID articleId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(10) int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(commentService.getByArticle(articleId, pageable));
    }

    /**
     * {@code POST /api/forum/articles/{articleId}/comments}: publishes a comment after moderating
     * it.
     *
     * @param articleId forum article
     * @param request alias and content
     * @return 201 with the published comment
     */
    @PostMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ForumCommentResponse> create(
            @PathVariable UUID articleId,
            @Valid @RequestBody ForumCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.create(articleId, request));
    }

    /**
     * {@code DELETE /api/forum/articles/{articleId}/comments/{commentId}}, owner only.
     *
     * @param commentId comment ID
     * @param context current user
     * @return 204
     */
    @DeleteMapping("/{commentId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> delete(
            @PathVariable UUID commentId,
            @CurrentSecurityContext SecurityContext context) {
        commentService.delete(commentId, context.getAuthentication().getName());
        return ResponseEntity.noContent().build();
    }
}
