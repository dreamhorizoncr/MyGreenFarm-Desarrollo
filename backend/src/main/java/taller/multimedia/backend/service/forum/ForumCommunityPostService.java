package taller.multimedia.backend.service.forum;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.forum.ForumCommunityPostRequest;
import taller.multimedia.backend.dto.forum.ForumCommunityPostResponse;
import taller.multimedia.backend.model.forum.ForumCommunityPost;
import taller.multimedia.backend.repository.forum.ForumCommunityPostRepository;
import taller.multimedia.backend.repository.forum.ForumPostLikeRepository;
import taller.multimedia.backend.repository.forum.ForumCommunityCommentRepository;
import taller.multimedia.backend.util.Sanitizer;

@Service
@RequiredArgsConstructor
public class ForumCommunityPostService {

    private final ForumCommunityPostRepository communityPostRepository;
    private final ForumPostLikeRepository postLikeRepository;
    private final ForumCommunityCommentRepository commentRepository;
    private final ForumModerationService moderationService;

    @Transactional(readOnly = true)
    public Page<ForumCommunityPostResponse> getAll(Pageable pageable) {
        return communityPostRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toResponse);
    }

    @Transactional
    public ForumCommunityPostResponse create(ForumCommunityPostRequest request) {
        String name = Sanitizer.requireClean("name", request.getName());
        moderationService.assertAppropriateName("name", name);
        String content = Sanitizer.requireCleanPreserveLineBreaks("content", request.getContent());
        content = moderationService.assertAppropriate(content);

        ForumCommunityPost post = new ForumCommunityPost();
        post.setName(name);
        post.setContent(content);
        return toResponse(communityPostRepository.save(post));
    }

    private ForumCommunityPostResponse toResponse(ForumCommunityPost post) {
        return ForumCommunityPostResponse.builder()
                .id(post.getId())
                .name(post.getName())
                .content(post.getContent())
                .createdAt(post.getCreatedAt())
                .reactionCount((int) postLikeRepository.countByCommunityPost_Id(post.getId()))
                .commentCount(commentRepository.countByCommunityPost_Id(post.getId()))
                .build();
    }
}
