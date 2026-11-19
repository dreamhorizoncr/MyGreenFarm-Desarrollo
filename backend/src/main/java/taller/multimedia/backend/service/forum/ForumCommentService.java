package taller.multimedia.backend.service.forum;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.forum.ForumCommentRequest;
import taller.multimedia.backend.dto.forum.ForumCommentResponse;
import taller.multimedia.backend.model.forum.ForumArticle;
import taller.multimedia.backend.model.forum.ForumComment;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.forum.ForumArticleRepository;
import taller.multimedia.backend.repository.forum.ForumCommentRepository;
import taller.multimedia.backend.repository.user.UserRepository;
import taller.multimedia.backend.util.Sanitizer;

/**
 * Comments that visitors leave on forum articles.
 */
@Service
@RequiredArgsConstructor
public class ForumCommentService {

    private final ForumCommentRepository commentRepository;
    private final ForumArticleRepository articleRepository;
    private final UserRepository userRepository;
    private final ForumMapper forumMapper;
    private final ForumModerationService moderationService;

    /**
     * @param articleId forum article
     * @param pageable page to return
     * @return the article's comments, newest first
     * @throws ResponseStatusException with 404 if the article does not exist
     */
    @Transactional(readOnly = true)
    public Page<ForumCommentResponse> getByArticle(UUID articleId, Pageable pageable) {
        ensureArticleExists(articleId);
        return commentRepository.findByArticleIdOrderByCreatedAtDesc(articleId, pageable)
                .map(forumMapper::toCommentResponse);
    }

    /**
     * Publishes a comment on an article after sanitizing it, checking the alias and checking that
     * the content is appropriate and related to the article's topic.
     *
     * @param articleId forum article
     * @param request alias and content; line breaks in the content are kept
     * @return the published comment
     * @throws ResponseStatusException with 404 if the article does not exist
     * @throws taller.multimedia.backend.exception.InvalidFieldException if the alias or content is unsafe, inappropriate or off-topic
     */
    @Transactional
    public ForumCommentResponse create(UUID articleId, ForumCommentRequest request) {
        ForumArticle article = findArticle(articleId);

        String alias = Sanitizer.requireClean("alias", request.getAlias());
        moderationService.assertAppropriateName("alias", alias);
        String content = Sanitizer.requireCleanPreserveLineBreaks("content", request.getContent());
        content = moderationService.assertCommentRelevant(article.getTopic(), article.getTitle(), content);

        ForumComment comment = new ForumComment();
        comment.setArticle(article);
        comment.setAlias(alias);
        comment.setContent(content);

        return forumMapper.toCommentResponse(commentRepository.save(comment));
    }

    /**
     * Deletes a comment. Only the owner role may do it.
     *
     * @param commentId comment to delete
     * @param currentEmail email of the authenticated user
     * @throws ResponseStatusException with 401 if the user does not exist, 403 if the user is not
     *     an owner, or 404 if the comment does not exist
     */
    @Transactional
    public void delete(UUID commentId, String currentEmail) {
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (currentUser.getRole() != Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only an OWNER can delete comments");
        }

        if (!commentRepository.existsById(commentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found: " + commentId);
        }

        commentRepository.deleteById(commentId);
    }

    private ForumArticle findArticle(UUID articleId) {
        return articleRepository.findById(articleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Article not found: " + articleId));
    }

    private void ensureArticleExists(UUID articleId) {
        if (!articleRepository.existsById(articleId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found: " + articleId);
        }
    }
}
