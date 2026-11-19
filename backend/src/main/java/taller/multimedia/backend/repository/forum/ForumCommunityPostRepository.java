package taller.multimedia.backend.repository.forum;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import taller.multimedia.backend.model.forum.ForumCommunityPost;

/**
 * Storage of community posts.
 */
public interface ForumCommunityPostRepository extends JpaRepository<ForumCommunityPost, UUID> {

    Page<ForumCommunityPost> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
