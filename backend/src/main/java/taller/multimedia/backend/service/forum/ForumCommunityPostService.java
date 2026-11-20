package taller.multimedia.backend.service.forum;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;
import org.apache.commons.text.StringEscapeUtils;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.forum.ForumCommunityCommentRequest;
import taller.multimedia.backend.dto.forum.ForumCommunityCommentResponse;
import taller.multimedia.backend.dto.forum.ForumCommunityPostRequest;
import taller.multimedia.backend.dto.forum.ForumCommunityPostResponse;
import taller.multimedia.backend.model.forum.ForumCommunityComment;
import taller.multimedia.backend.model.forum.ForumCommunityPost;
import taller.multimedia.backend.repository.forum.ForumCommunityPostRepository;
import taller.multimedia.backend.repository.forum.ForumPostLikeRepository;
import taller.multimedia.backend.repository.forum.ForumCommunityCommentRepository;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.util.Sanitizer;

/**
 * Posts that visitors publish in the community section of the forum.
 */
@Service
@RequiredArgsConstructor
public class ForumCommunityPostService {

    private final ForumCommunityPostRepository communityPostRepository;
    private final ForumPostLikeRepository postLikeRepository;
    private final ForumCommunityCommentRepository commentRepository;
    private final ForumModerationService moderationService;

    /**
     * @param pageable page to return
     * @return community posts, newest first, with their like and comment counts
     */
    @Transactional(readOnly = true)
    public Page<ForumCommunityPostResponse> getAll(Pageable pageable) {
        return communityPostRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toResponse);
    }

    /**
     * Publishes a community post after sanitizing it and passing it through the forum moderation
     * filter.
     *
     * @param request author name and content; line breaks in the content are kept
     * @return the published post
     * @throws InvalidFieldException if the name or content is unsafe or inappropriate
     */
    @Transactional
    public ForumCommunityPostResponse create(ForumCommunityPostRequest request) {
        String name = Sanitizer.requireClean("name", request.getName());
        moderationService.assertAppropriateName("name", name);
        String content = Sanitizer.requireCleanPreserveLineBreaks("content", request.getContent());
        content = moderationService.assertAppropriate(content);

        ForumCommunityPost post = new ForumCommunityPost();
        post.setName(name);
        post.setContent(content);
        return toResponse(communityPostRepository.save(post));
    }

    /**
     * Deletes a community post together with its likes and comments.
     *
     * @param id post to delete
     * @return {@code false} if the post did not exist
     */
    @Transactional
    public boolean delete(UUID id) {
        if (!communityPostRepository.existsById(id)) return false;
        postLikeRepository.deleteByCommunityPost_Id(id);
        commentRepository.deleteByCommunityPost_Id(id);
        communityPostRepository.deleteById(id);
        return true;
    }

    /**
     * @param postId community post
     * @param pageable page to return
     * @return the post's comments, oldest first, or empty if the post does not exist
     */
    @Transactional(readOnly = true)
    public Optional<Page<ForumCommunityCommentResponse>> getComments(UUID postId, Pageable pageable) {
        if (!communityPostRepository.existsById(postId)) {
            return Optional.empty();
        }
        return Optional.of(commentRepository.findByCommunityPost_IdOrderByCreatedAtAsc(postId, pageable)
                .map(comment -> ForumCommunityCommentResponse.builder()
                        .id(comment.getId())
                        .communityPostId(postId)
                        .alias(StringEscapeUtils.unescapeHtml4(comment.getAlias()))
                        .content(StringEscapeUtils.unescapeHtml4(comment.getContent()))
                        .createdAt(comment.getCreatedAt())
                        .build()));
    }

    /**
     * Publishes a comment on a community post after sanitizing it and passing it through the
     * forum moderation filter.
     *
     * @param postId community post
     * @param request alias and content; line breaks in the content are kept
     * @return the published comment, or empty if the post does not exist
     * @throws InvalidFieldException if the alias or content is unsafe or inappropriate
     */
    @Transactional
    public Optional<ForumCommunityCommentResponse> addComment(UUID postId, ForumCommunityCommentRequest request) {
        Optional<ForumCommunityPost> post = communityPostRepository.findById(postId);
        if (post.isEmpty()) {
            return Optional.empty();
        }
        String alias = Sanitizer.requireClean("alias", request.getAlias());
        moderationService.assertAppropriateName("alias", alias);
        String content = Sanitizer.requireCleanPreserveLineBreaks("content", request.getContent());
        content = moderationService.assertAppropriate(content);

        ForumCommunityComment comment = new ForumCommunityComment();
        comment.setCommunityPost(post.get());
        comment.setAlias(alias);
        comment.setContent(content);
        ForumCommunityComment saved = commentRepository.save(comment);
        return Optional.of(ForumCommunityCommentResponse.builder()
                .id(saved.getId())
                .communityPostId(postId)
                .alias(saved.getAlias())
                .content(saved.getContent())
                .createdAt(saved.getCreatedAt())
                .build());
    }

    /**
     * @param postId community post the comment must belong to
     * @param commentId comment to delete
     * @return {@code false} if the comment does not exist or belongs to another post
     */
    @Transactional
    public boolean deleteComment(UUID postId, UUID commentId) {
        Optional<ForumCommunityComment> comment = commentRepository.findById(commentId);
        if (comment.isEmpty() || !comment.get().getCommunityPost().getId().equals(postId)) {
            return false;
        }
        commentRepository.delete(comment.get());
        return true;
    }

    private ForumCommunityPostResponse toResponse(ForumCommunityPost post) {
        return ForumCommunityPostResponse.builder()
                .id(post.getId())
                .name(post.getName())
                .content(post.getContent())
                .createdAt(post.getCreatedAt())
                .reactionCount((int) postLikeRepository.countByCommunityPost_Id(post.getId()))
                .commentCount(commentRepository.countByCommunityPost_Id(post.getId()))
                .build();
    }
}
