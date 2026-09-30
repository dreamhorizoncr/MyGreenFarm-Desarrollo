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
import taller.multimedia.backend.dto.forum.ForumMapper;
import taller.multimedia.backend.model.forum.ForumArticle;
import taller.multimedia.backend.model.forum.ForumComment;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.forum.ForumArticleRepository;
import taller.multimedia.backend.repository.forum.ForumCommentRepository;
import taller.multimedia.backend.repository.user.UserRepository;
import taller.multimedia.backend.util.Sanitizer;

@Service
@RequiredArgsConstructor
public class ForumCommentService {

    private final ForumCommentRepository commentRepository;
    private final ForumArticleRepository articleRepository;
    private final UserRepository userRepository;
    private final ForumMapper forumMapper;

    @Transactional(readOnly = true)
    public Page<ForumCommentResponse> getByArticle(UUID articleId, Pageable pageable) {
        ensureArticleExists(articleId);
        return commentRepository.findByArticleIdOrderByCreatedAtDesc(articleId, pageable)
                .map(forumMapper::toCommentResponse);
    }

    @Transactional
    public ForumCommentResponse create(UUID articleId, ForumCommentRequest request) {
        ForumArticle article = findArticle(articleId);

        ForumComment comment = new ForumComment();
        comment.setArticle(article);
        comment.setAlias(Sanitizer.requireClean("alias", request.getAlias()));
        comment.setContent(Sanitizer.requireCleanPreserveLineBreaks("content", request.getContent()));

        return forumMapper.toCommentResponse(commentRepository.save(comment));
    }

    @Transactional
    public void delete(UUID commentId, String currentEmail) {
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));

        if (currentUser.getRole() != Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo un OWNER puede eliminar comentarios");
        }

        if (!commentRepository.existsById(commentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comentario no encontrado: " + commentId);
        }

        commentRepository.deleteById(commentId);
    }

    private ForumArticle findArticle(UUID articleId) {
        return articleRepository.findById(articleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Artículo no encontrado: " + articleId));
    }

    private void ensureArticleExists(UUID articleId) {
        if (!articleRepository.existsById(articleId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Artículo no encontrado: " + articleId);
        }
    }
}
