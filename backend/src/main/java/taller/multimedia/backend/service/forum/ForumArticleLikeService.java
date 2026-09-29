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

@Service
@RequiredArgsConstructor
public class ForumArticleLikeService {

    private final ForumArticleLikeRepository likeRepository;
    private final ForumArticleRepository articleRepository;

    @Transactional
    public ForumArticleLikeResponse toggleLike(UUID articleId, String anonId) {
        if (anonId == null || anonId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se encontró el identificador del visitante");
        }

        if (!articleRepository.existsById(articleId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Artículo no encontrado: " + articleId);
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
