package taller.multimedia.backend.repository.forum;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.forum.ForumArticle;

@Repository
public interface ForumArticleRepository extends JpaRepository<ForumArticle, UUID> {

    Page<ForumArticle> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<ForumArticle> findAllByAuthor_IdOrderByCreatedAtDesc(UUID authorId, Pageable pageable);

    Page<ForumArticle> findByTopicIgnoreCaseOrderByCreatedAtDesc(String topic, Pageable pageable);

    @Modifying
    @Query("UPDATE ForumArticle a SET a.author = NULL WHERE a.author.id = :authorId")
    int unlinkAuthor(@Param("authorId") UUID authorId);
}
