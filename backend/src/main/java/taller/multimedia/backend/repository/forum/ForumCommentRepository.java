package taller.multimedia.backend.repository.forum;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.forum.ForumComment;

@Repository
public interface ForumCommentRepository extends JpaRepository<ForumComment, UUID> {

    Page<ForumComment> findByArticleIdOrderByCreatedAtDesc(UUID articleId, Pageable pageable);

    long countByArticleId(UUID articleId);

    void deleteByArticleId(UUID articleId);
}
