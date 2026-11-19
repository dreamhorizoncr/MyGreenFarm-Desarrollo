package taller.multimedia.backend.service.forum;

import java.util.List;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.forum.ForumPostLikeResponse;
import taller.multimedia.backend.model.forum.ForumPostLike;
import taller.multimedia.backend.repository.forum.ForumCommunityPostRepository;
import taller.multimedia.backend.repository.forum.ForumPostLikeRepository;

/**
 * Likes on community forum posts from anonymous visitors, identified by an anonymous ID stored in
 * their browser.
 */
@Service 
@RequiredArgsConstructor
public class ForumPostLikeService {
    private final ForumPostLikeRepository postLikeRepository;
    private final ForumCommunityPostRepository communityPostRepository;

    /**
     * Adds the visitor's like to a community post, or removes it if they had already liked it.
     *
     * <p>If two requests from the same visitor race and the unique constraint rejects the second
     * insert, the post is reported as liked.
     *
     * @param communityPostId community post
     * @param anonId anonymous visitor ID
     * @return whether the post is now liked by the visitor and its total likes
     * @throws ResponseStatusException with 400 if {@code anonId} is blank, or 404 if the post does
     *     not exist
     */
    @Transactional 
    public ForumPostLikeResponse toggleLike(UUID communityPostId, String anonId) {
        if (anonId == null || anonId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The visitor ID was not found");
        }

        if (!communityPostRepository.existsById(communityPostId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found: " + communityPostId);
        }

        boolean alreadyLiked = postLikeRepository.existsByCommunityPost_IdAndAnonId(communityPostId, anonId);
        boolean liked;
        if (alreadyLiked) {
            postLikeRepository.deleteByCommunityPost_IdAndAnonId(communityPostId, anonId);
            liked = false;
        } else {
            try {
                ForumPostLike like = new ForumPostLike();
                like.setCommunityPost(communityPostRepository.getReferenceById(communityPostId));
                like.setAnonId(anonId);
                postLikeRepository.save(like);
                liked = true;
            } catch (DataIntegrityViolationException exception) {
                liked = true;
            }
        }

        int totalLikes = (int) postLikeRepository.countByCommunityPost_Id(communityPostId);
        return new ForumPostLikeResponse(communityPostId, totalLikes, liked);
    }

    /**
     * @param anonId anonymous visitor ID, may be blank
     * @return IDs of the community posts the visitor has liked, or an empty list when there is no
     *     visitor ID
     */
    @Transactional (readOnly = true)
    public List<UUID> findLikedPostIds(String anonId) {
        if (anonId == null || anonId.isBlank()) {
            return List.of();
        }

        return postLikeRepository.findByAnonId(anonId).stream()
                .map(like -> like.getCommunityPost().getId())
                .toList();
    }
}
