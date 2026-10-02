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

@Service 
@RequiredArgsConstructor
public class ForumPostLikeService {
    private final ForumPostLikeRepository postLikeRepository;
    private final ForumCommunityPostRepository communityPostRepository;

    @Transactional 
    public ForumPostLikeResponse toggleLike(UUID communityPostId, String anonId) {
        if (anonId == null || anonId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se encontró el identificador del visitante");
        }

        if (!communityPostRepository.existsById(communityPostId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post no encontrado: " + communityPostId);
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
