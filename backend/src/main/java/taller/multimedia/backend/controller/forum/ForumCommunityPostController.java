package taller.multimedia.backend.controller.forum;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.forum.ForumCommunityPostRequest;
import taller.multimedia.backend.dto.forum.ForumCommunityPostResponse;
import taller.multimedia.backend.service.forum.ForumCommunityPostService;

@Validated
@RestController
@RequestMapping("/api/forum/community")
@RequiredArgsConstructor
public class ForumCommunityPostController {

    private final ForumCommunityPostService communityPostService;

    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<Page<ForumCommunityPostResponse>> getAll(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(10) int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(communityPostService.getAll(pageable));
    }

    @PostMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ForumCommunityPostResponse> create(
            @Valid @RequestBody ForumCommunityPostRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(communityPostService.create(request));
    }
}
