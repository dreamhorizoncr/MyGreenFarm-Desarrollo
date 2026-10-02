package taller.multimedia.backend.repository.forum;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;
import taller.multimedia.backend.dto.forum.ForumPostLikeResponse;
import taller.multimedia.backend.model.forum.ForumPostLike;

@Repository 
public interface ForumPostLikeRepository extends JpaRepository<ForumPostLike, UUID> {
boolean existsByCommunityPost_IdAndAnonId(UUID communityPostId, String anonId);

long countByCommunityPost_Id(UUID communityPostId);

void deleteByCommunityPost_IdAndAnonId(UUID communityPostId, String anonId);

void deleteByCommunityPost_Id(UUID communityPostId);

    List<ForumPostLike> findByAnonId(String anonId);

    @Query("SELECT fal.communityPost.id AS postId, COUNT(fal) AS total "
            + "FROM ForumPostLike fal "
            + "WHERE fal.communityPost.id IN :postIds "
            + "GROUP BY fal.communityPost.id")
    List<ForumPostLikeCountProjection> countByCommunityPostIdIn(@Param("postIds") List<UUID> postIds);
}