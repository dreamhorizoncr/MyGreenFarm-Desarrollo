package taller.multimedia.backend.controller.forum;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import taller.multimedia.backend.dto.forum.ForumCommunityCommentRequest;
import taller.multimedia.backend.dto.forum.ForumCommunityCommentResponse;

import java.util.UUID;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.forum.ForumCommunityPostRequest;
import taller.multimedia.backend.dto.forum.ForumCommunityPostResponse;
import taller.multimedia.backend.service.forum.ForumCommunityPostService;

/**
 * Community wall of the forum: visitors read and publish posts and comments, which are moderated
 * before being saved; only the owner may delete them.
 */
@Validated
@RestController
@RequestMapping("/api/forum/community")
@RequiredArgsConstructor
public class ForumCommunityPostController {

    private final ForumCommunityPostService communityPostService;
    /**
     * {@code GET /api/forum/community}
     *
     * @param page page number, from 0
     * @param size page size, 1 to 10
     * @return posts, newest first
     */
    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<Page<ForumCommunityPostResponse>> getAll(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(10) int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(communityPostService.getAll(pageable));
    }

    /**
     * {@code POST /api/forum/community}
     *
     * @param request author name and content
     * @return 201 with the published post
     */
    @PostMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ForumCommunityPostResponse> create(
            @Valid @RequestBody ForumCommunityPostRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(communityPostService.create(request));
    }

    /**
     * {@code GET /api/forum/community/{postId}/comments}
     *
     * @param postId community post
     * @param page page number, from 0
     * @param size page size, 1 to 50
     * @return the comments, oldest first, or 404 if the post does not exist
     */
    @GetMapping("/{postId}/comments")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Page<ForumCommunityCommentResponse>> comments(
            @PathVariable UUID postId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(50) int size) {
        return communityPostService.getComments(postId, PageRequest.of(page, size))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * {@code POST /api/forum/community/{postId}/comments}
     *
     * @param postId community post
     * @param request alias and content
     * @return 201 with the published comment, or 404 if the post does not exist
     */
    @PostMapping("/{postId}/comments")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ForumCommunityCommentResponse> addComment(@PathVariable UUID postId,
            @Valid @RequestBody ForumCommunityCommentRequest request) {
        return communityPostService.addComment(postId, request)
                .map(comment -> ResponseEntity.status(HttpStatus.CREATED).body(comment))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * {@code DELETE /api/forum/community/{postId}}: deletes the post with its likes and comments.
     *
     * @param postId community post
     * @return 204, or 404 if it does not exist
     */
    @DeleteMapping("/{postId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> delete(@PathVariable UUID postId) {
        return communityPostService.delete(postId) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    /**
     * {@code DELETE /api/forum/community/{postId}/comments/{commentId}}
     *
     * @param postId community post
     * @param commentId comment to delete
     * @return 204, or 404 if the comment does not exist or belongs to another post
     */
    @DeleteMapping("/{postId}/comments/{commentId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteComment(@PathVariable UUID postId, @PathVariable UUID commentId) {
        return communityPostService.deleteComment(postId, commentId)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
