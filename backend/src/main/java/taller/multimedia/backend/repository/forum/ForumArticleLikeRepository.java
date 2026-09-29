package taller.multimedia.backend.repository.forum;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;
import taller.multimedia.backend.model.forum.ForumArticleLike;

@Repository
public interface ForumArticleLikeRepository extends JpaRepository<ForumArticleLike, UUID> {

    boolean existsByArticleIdAndAnonId(UUID articleId, String anonId);

    long countByArticleId(UUID articleId);

    @Transactional
    void deleteByArticleIdAndAnonId(UUID articleId, String anonId);

    @Transactional
    void deleteByArticleId(UUID articleId);

    List<ForumArticleLike> findByAnonId(String anonId);

    @Query("SELECT fal.article.id AS articleId, COUNT(fal) AS total "
            + "FROM ForumArticleLike fal "
            + "WHERE fal.article.id IN :articleIds "
            + "GROUP BY fal.article.id")
    List<ForumArticleLikeCountProjection> countByArticleIdIn(@Param("articleIds") List<UUID> articleIds);
}
