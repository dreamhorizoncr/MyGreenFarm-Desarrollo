package taller.multimedia.backend.repository.forum;
import java.util.UUID;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import taller.multimedia.backend.model.forum.ForumCommunityComment;
public interface ForumCommunityCommentRepository extends JpaRepository<ForumCommunityComment, UUID> {
    Page<ForumCommunityComment> findByCommunityPost_IdOrderByCreatedAtAsc(UUID postId, Pageable pageable);
    long countByCommunityPost_Id(UUID postId);
}
