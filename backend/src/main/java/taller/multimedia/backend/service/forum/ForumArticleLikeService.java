package taller.multimedia.backend.service.forum;

import java.util.List;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.forum.ForumArticleLikeResponse;
import taller.multimedia.backend.model.forum.ForumArticleLike;
import taller.multimedia.backend.repository.forum.ForumArticleLikeRepository;
import taller.multimedia.backend.repository.forum.ForumArticleRepository;

/**
 * Likes on forum articles from anonymous visitors, identified by an anonymous ID stored in their
 * browser.
 */
@Service
@RequiredArgsConstructor
public class ForumArticleLikeService {

    private final ForumArticleLikeRepository likeRepository;
    private final ForumArticleRepository articleRepository;

    /**
     * Adds the visitor's like to an article, or removes it if they had already liked it.
     *
     * <p>If two requests from the same visitor race and the unique constraint rejects the second
     * insert, the article is reported as liked.
     *
     * @param articleId forum article
     * @param anonId anonymous visitor ID
     * @return whether the article is now liked by the visitor and its total likes
     * @throws ResponseStatusException with 400 if {@code anonId} is blank, or 404 if the article
     *     does not exist
     */
    @Transactional
    public ForumArticleLikeResponse toggleLike(UUID articleId, String anonId) {
        if (anonId == null || anonId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The visitor ID was not found");
        }

        if (!articleRepository.existsById(articleId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found: " + articleId);
        }

        boolean alreadyLiked = likeRepository.existsByArticleIdAndAnonId(articleId, anonId);
        boolean liked;
        if (alreadyLiked) {
            likeRepository.deleteByArticleIdAndAnonId(articleId, anonId);
            liked = false;
        } else {
            try {
                ForumArticleLike like = new ForumArticleLike();
                like.setArticle(articleRepository.getReferenceById(articleId));
                like.setAnonId(anonId);
                likeRepository.save(like);
                liked = true;
            } catch (DataIntegrityViolationException exception) {
                liked = true;
            }
        }

        int totalLikes = (int) likeRepository.countByArticleId(articleId);
        return new ForumArticleLikeResponse(articleId, totalLikes, liked);
    }

    /**
     * @param anonId anonymous visitor ID, may be blank
     * @return IDs of the articles the visitor has liked, or an empty list when there is no visitor
     *     ID
     */
    @Transactional(readOnly = true)
    public List<UUID> findLikedArticleIds(String anonId) {
        if (anonId == null || anonId.isBlank()) {
            return List.of();
        }

        return likeRepository.findByAnonId(anonId).stream()
                .map(like -> like.getArticle().getId())
                .toList();
    }
}
