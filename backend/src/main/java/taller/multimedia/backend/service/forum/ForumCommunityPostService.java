package taller.multimedia.backend.service.forum;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.forum.ForumCommunityPostRequest;
import taller.multimedia.backend.dto.forum.ForumCommunityPostResponse;
import taller.multimedia.backend.model.forum.ForumCommunityPost;
import taller.multimedia.backend.repository.forum.ForumCommunityPostRepository;
import taller.multimedia.backend.util.Sanitizer;

@Service
@RequiredArgsConstructor
public class ForumCommunityPostService {

    private final ForumCommunityPostRepository communityPostRepository;

    @Transactional(readOnly = true)
    public Page<ForumCommunityPostResponse> getAll(Pageable pageable) {
        return communityPostRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toResponse);
    }

    @Transactional
    public ForumCommunityPostResponse create(ForumCommunityPostRequest request) {
        ForumCommunityPost post = new ForumCommunityPost();
        post.setName(Sanitizer.requireClean("name", request.getName()));
        post.setContent(Sanitizer.requireCleanPreserveLineBreaks("content", request.getContent()));
        return toResponse(communityPostRepository.save(post));
    }

    private ForumCommunityPostResponse toResponse(ForumCommunityPost post) {
        return ForumCommunityPostResponse.builder()
                .id(post.getId())
                .name(post.getName())
                .content(post.getContent())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
