package taller.multimedia.backend.controller.forum;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.CurrentSecurityContext;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.forum.ForumArticleRequest;
import taller.multimedia.backend.dto.forum.ForumArticleResponse;
import taller.multimedia.backend.service.forum.ForumArticleService;

@Validated
@RestController
@RequestMapping("/api/forum/articles")
@RequiredArgsConstructor
public class ForumArticleController {

    private final ForumArticleService articleService;

    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<Page<ForumArticleResponse>> getAll(
            @RequestParam(required = false) String topic,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(10) int size,
            @CookieValue(name = "anon_id", required = false) String anonId) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(articleService.getAll(topic, pageable, anonId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ForumArticleResponse> getById(
            @PathVariable UUID id,
            @CookieValue(name = "anon_id", required = false) String anonId) {
        return ResponseEntity.ok(articleService.getById(id, anonId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'TEACHER')")
    public ResponseEntity<ForumArticleResponse> create(
            @RequestPart("article") @Valid ForumArticleRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @CurrentSecurityContext SecurityContext context,
            @CookieValue(name = "anon_id", required = false) String anonId) {
        ForumArticleResponse created = articleService.create(request, image, currentEmail(context), anonId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'TEACHER')")
    public ResponseEntity<ForumArticleResponse> update(
            @PathVariable UUID id,
            @RequestPart("article") @Valid ForumArticleRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @CurrentSecurityContext SecurityContext context,
            @CookieValue(name = "anon_id", required = false) String anonId) {
        ForumArticleResponse updated = articleService.update(
                id, request, image, currentEmail(context), anonId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'TEACHER')")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @CurrentSecurityContext SecurityContext context) {
        articleService.delete(id, currentEmail(context));
        return ResponseEntity.noContent().build();
    }

    private String currentEmail(SecurityContext context) {
        return context.getAuthentication().getName();
    }
}
