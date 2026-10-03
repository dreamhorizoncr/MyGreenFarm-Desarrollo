package taller.multimedia.backend.controller.forum;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import taller.multimedia.backend.repository.forum.ForumCommunityPostRepository;
import taller.multimedia.backend.repository.forum.ForumCommunityCommentRepository;
import taller.multimedia.backend.model.forum.ForumCommunityComment;
import taller.multimedia.backend.dto.forum.ForumCommunityCommentRequest;
import taller.multimedia.backend.dto.forum.ForumCommunityCommentResponse;
import taller.multimedia.backend.util.Sanitizer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.forum.ForumCommunityPostRequest;
import taller.multimedia.backend.dto.forum.ForumCommunityPostResponse;
import taller.multimedia.backend.service.forum.ForumCommunityPostService;
import taller.multimedia.backend.service.forum.ForumModerationService;

@Validated
@RestController
@RequestMapping("/api/forum/community")
@RequiredArgsConstructor
public class ForumCommunityPostController {

    private final ForumCommunityPostService communityPostService;
    private final ForumCommunityPostRepository postRepository;
    private final ForumCommunityCommentRepository commentRepository;
    private final ForumModerationService moderationService;

    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<Page<ForumCommunityPostResponse>> getAll(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(10) int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(communityPostService.getAll(pageable));
    }

    @PostMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ForumCommunityPostResponse> create(
            @Valid @RequestBody ForumCommunityPostRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(communityPostService.create(request));
    }

    @GetMapping("/{postId}/comments")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Page<ForumCommunityCommentResponse>> comments(
            @PathVariable java.util.UUID postId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(50) int size) {
        if (!postRepository.existsById(postId)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(commentRepository.findByCommunityPost_IdOrderByCreatedAtAsc(postId, PageRequest.of(page, size))
                .map(c -> ForumCommunityCommentResponse.builder().id(c.getId()).communityPostId(postId)
                        .alias(org.apache.commons.text.StringEscapeUtils.unescapeHtml4(c.getAlias()))
                        .content(org.apache.commons.text.StringEscapeUtils.unescapeHtml4(c.getContent())).createdAt(c.getCreatedAt()).build()));
    }

    @PostMapping("/{postId}/comments")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ForumCommunityCommentResponse> addComment(@PathVariable java.util.UUID postId,
            @Valid @RequestBody ForumCommunityCommentRequest request) {
        var post = postRepository.findById(postId).orElse(null);
        if (post == null) return ResponseEntity.notFound().build();
        String alias = Sanitizer.requireClean("alias", request.getAlias());
        String content = Sanitizer.requireCleanPreserveLineBreaks("content", request.getContent());
        content = moderationService.assertAppropriate(content);

        var comment = new ForumCommunityComment();
        comment.setCommunityPost(post);
        comment.setAlias(alias);
        comment.setContent(content);
        var saved = commentRepository.save(comment);
        return ResponseEntity.status(HttpStatus.CREATED).body(ForumCommunityCommentResponse.builder().id(saved.getId())
                .communityPostId(postId).alias(saved.getAlias()).content(saved.getContent()).createdAt(saved.getCreatedAt()).build());
    }
}
