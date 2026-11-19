package taller.multimedia.backend.service.forum;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.forum.ForumArticleRequest;
import taller.multimedia.backend.dto.forum.ForumArticleResponse;
import taller.multimedia.backend.model.forum.ForumArticle;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.forum.ForumArticleLikeCountProjection;
import taller.multimedia.backend.repository.forum.ForumArticleLikeRepository;
import taller.multimedia.backend.repository.forum.ForumArticleRepository;
import taller.multimedia.backend.repository.forum.ForumCommentRepository;
import taller.multimedia.backend.repository.user.UserRepository;
import taller.multimedia.backend.service.storage.StorageService;
import taller.multimedia.backend.util.Sanitizer;

/**
 * Articles that staff publish in the forum's blog, with an optional image stored in the forum
 * bucket. The owner may manage every article; a teacher only their own.
 */
@Service
@RequiredArgsConstructor
public class ForumArticleService {

    private static final String[] ALLOWED_IMAGE_TYPES = {
            "image/png", "image/jpg", "image/jpeg", "image/svg+xml", "image/webp"
    };

    private final ForumArticleRepository articleRepository;
    private final ForumArticleLikeRepository likeRepository;
    private final ForumCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final ForumMapper forumMapper;
    private final StorageService storageService;

    @Value("${supabase.s3.buckets.forum:}")
    private String forumBucket;

    /**
     * Publishes an article. When the author name or role is not given, the user's full name and a
     * default role (teacher or administration) are used.
     *
     * @param request title, topic, content (line breaks kept), author fields and image alt text
     * @param image optional image in PNG, JPG, JPEG, SVG or WEBP format; the alt text is then
     *     required
     * @param currentEmail email of the authenticated user
     * @param anonId anonymous visitor ID, used to report whether the visitor liked it
     * @return the published article
     * @throws ResponseStatusException with 401 if the user does not exist, 400 if the image is not
     *     valid, or 500 if the forum bucket is not configured
     * @throws taller.multimedia.backend.exception.InvalidFieldException if a text is unsafe
     */
    @Transactional
    public ForumArticleResponse create(ForumArticleRequest request, MultipartFile image, String currentEmail,
            String anonId) {
        User author = findUser(currentEmail);
        validateImage(request, image);

        ForumArticle article = new ForumArticle();
        article.setTitle(Sanitizer.requireClean("title", request.getTitle()));
        article.setTopic(Sanitizer.requireClean("topic", request.getTopic()));
        article.setContent(Sanitizer.requireCleanPreserveLineBreaks("content", request.getContent()));
        article.setAuthor(author);
        String defaultAuthorRole = author.getRole() == Role.TEACHER
                ? "Docente de My Green Farm"
                : "Administración de My Green Farm";
        article.setAuthorName(displayValue(request.getAuthorName(), fullName(author)));
        article.setAuthorRole(displayValue(request.getAuthorRole(), defaultAuthorRole));
        applyImage(article, image, request.getImageAlt());

        ForumArticle saved = articleRepository.save(article);
        return toResponse(saved, anonId);
    }

    /**
     * @param topic topic to filter by (case-insensitive), or blank for all
     * @param pageable page to return
     * @param anonId anonymous visitor ID, may be {@code null}
     * @return articles, newest first, with likes, comment counts and whether the visitor liked each
     *     one
     */
    @Transactional(readOnly = true)
    public Page<ForumArticleResponse> getAll(String topic, Pageable pageable, String anonId) {
        Page<ForumArticle> articles = topic == null || topic.isBlank()
                ? articleRepository.findAllByOrderByCreatedAtDesc(pageable)
                : articleRepository.findByTopicIgnoreCaseOrderByCreatedAtDesc(topic.trim(), pageable);

        return mapPage(articles, anonId);
    }

    /**
     * @param currentEmail email of the authenticated user
     * @param pageable page to return
     * @param anonId anonymous visitor ID, may be {@code null}
     * @return the user's own articles, newest first
     * @throws ResponseStatusException with 401 if the user does not exist
     */
    @Transactional(readOnly = true)
    public Page<ForumArticleResponse> getMine(String currentEmail, Pageable pageable, String anonId) {
        User author = findUser(currentEmail);
        Page<ForumArticle> articles = articleRepository.findAllByAuthor_IdOrderByCreatedAtDesc(
                author.getId(), pageable);
        return mapPage(articles, anonId);
    }

    /**
     * @param id article ID
     * @param anonId anonymous visitor ID, may be {@code null}
     * @return the article
     * @throws ResponseStatusException with 404 if it does not exist
     */
    @Transactional(readOnly = true)
    public ForumArticleResponse getById(UUID id, String anonId) {
        ForumArticle article = findArticle(id);
        return toResponse(article, anonId);
    }

    /**
     * Updates an article. The image can be kept, replaced or removed; a replaced or removed image
     * is deleted from storage.
     *
     * @param id article ID
     * @param request new data; {@code removeImage} removes the current image
     * @param image new image, optional
     * @param currentEmail email of the authenticated user
     * @param anonId anonymous visitor ID, may be {@code null}
     * @return the updated article
     * @throws ResponseStatusException with 401, 403 if the user may not manage it, 404 if it does
     *     not exist, or 400 if the image is not valid
     * @throws taller.multimedia.backend.exception.InvalidFieldException if a text is unsafe
     */
    @Transactional
    public ForumArticleResponse update(UUID id, ForumArticleRequest request, MultipartFile image,
            String currentEmail, String anonId) {
        User currentUser = findUser(currentEmail);
        ForumArticle article = findArticle(id);
        ensureCanManage(article, currentUser);
        validateImage(request, image);

        article.setTitle(Sanitizer.requireClean("title", request.getTitle()));
        article.setTopic(Sanitizer.requireClean("topic", request.getTopic()));
        article.setContent(Sanitizer.requireCleanPreserveLineBreaks("content", request.getContent()));
        article.setAuthorName(displayValue(request.getAuthorName(), article.getAuthorName()));
        article.setAuthorRole(displayValue(request.getAuthorRole(), article.getAuthorRole()));

        if (request.isRemoveImage()) {
            deleteStoredImage(article.getImageUrl());
            article.setImageUrl(null);
            article.setImageAlt(null);
        } else if (image != null && !image.isEmpty()) {
            deleteStoredImage(article.getImageUrl());
            applyImage(article, image, request.getImageAlt());
        } else if (article.getImageUrl() != null) {
            if (request.getImageAlt() != null && !request.getImageAlt().isBlank()) {
                article.setImageAlt(Sanitizer.requireClean("imageAlt", request.getImageAlt()));
            }
        } else {
            article.setImageAlt(null);
        }

        ForumArticle updated = articleRepository.save(article);
        return toResponse(updated, anonId);
    }

    /**
     * Deletes an article with its image, likes and comments.
     *
     * @param id article ID
     * @param currentEmail email of the authenticated user
     * @throws ResponseStatusException with 401, 403 if the user may not manage it, or 404 if it
     *     does not exist
     */
    @Transactional
    public void delete(UUID id, String currentEmail) {
        User currentUser = findUser(currentEmail);
        ForumArticle article = findArticle(id);
        ensureCanManage(article, currentUser);

        deleteStoredImage(article.getImageUrl());
        likeRepository.deleteByArticleId(id);
        commentRepository.deleteByArticleId(id);
        articleRepository.delete(article);
    }

    /**
     * @param articles page of articles
     * @param anonId anonymous visitor ID, may be {@code null}
     * @return the responses; like counts are loaded with one query for the whole page
     */
    private Page<ForumArticleResponse> mapPage(Page<ForumArticle> articles, String anonId) {
        List<UUID> articleIds = articles.getContent().stream()
                .map(ForumArticle::getId)
                .toList();

        List<ForumArticleLikeCountProjection> reactionProjections = articleIds.isEmpty()
                ? List.of()
                : likeRepository.countByArticleIdIn(articleIds);

        Map<UUID, Long> reactionCounts = reactionProjections.stream()
                .collect(Collectors.toMap(
                        ForumArticleLikeCountProjection::getArticleId,
                        ForumArticleLikeCountProjection::getTotal));

        return articles.map(article -> forumMapper.toArticleResponse(
                article,
                reactionCounts.getOrDefault(article.getId(), 0L),
                anonId != null && likeRepository.existsByArticleIdAndAnonId(article.getId(), anonId),
                commentRepository.countByArticleId(article.getId())));
    }

    private ForumArticleResponse toResponse(ForumArticle article, String anonId) {
        boolean reacted = anonId != null && likeRepository.existsByArticleIdAndAnonId(article.getId(), anonId);
        return forumMapper.toArticleResponse(
                article,
                likeRepository.countByArticleId(article.getId()),
                reacted,
                commentRepository.countByArticleId(article.getId()));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private ForumArticle findArticle(UUID id) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Article not found: " + id));
    }

    /**
     * @param article article to manage
     * @param currentUser authenticated user
     * @throws ResponseStatusException with 403 unless the user is the owner, or a teacher who wrote
     *     the article
     */
    private void ensureCanManage(ForumArticle article, User currentUser) {
        boolean owner = currentUser.getRole() == Role.OWNER;
        boolean ownArticle = article.getAuthor() != null
                && article.getAuthor().getId().equals(currentUser.getId());
        boolean teacherOwnArticle = currentUser.getRole() == Role.TEACHER && ownArticle;

        if (!owner && !teacherOwnArticle) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You do not have permission to manage this article");
        }
    }

    /**
     * @param request article data, for the alt text
     * @param image uploaded image, may be {@code null}
     * @throws ResponseStatusException with 400 if there is an image without alt text or with a
     *     format that is not allowed
     */
    private void validateImage(ForumArticleRequest request, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return;
        }

        if (request.getImageAlt() == null || request.getImageAlt().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The alt text is required when there is an image");
        }

        String contentType = image.getContentType();
        boolean allowed = contentType != null && List.of(ALLOWED_IMAGE_TYPES).contains(contentType);
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unsupported image format. Use PNG, JPG, JPEG or SVG");
        }
    }

    private void applyImage(ForumArticle article, MultipartFile image, String imageAlt) {
        if (image == null || image.isEmpty()) {
            article.setImageUrl(null);
            article.setImageAlt(null);
            return;
        }

        if (forumBucket == null || forumBucket.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "The forum image bucket is not configured");
        }

        article.setImageUrl(storageService.uploadFile(image, forumBucket, "forum_articles"));
        article.setImageAlt(Sanitizer.requireClean("imageAlt", imageAlt));
    }

    private void deleteStoredImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank() || forumBucket == null || forumBucket.isBlank()) {
            return;
        }

        String marker = "/" + forumBucket + "/";
        int markerIndex = imageUrl.indexOf(marker);
        if (markerIndex >= 0) {
            storageService.deleteFile(forumBucket, imageUrl.substring(markerIndex + marker.length()));
        }
    }

    private String fullName(User user) {
        return (user.getFirstName() + " " + user.getLastName()).trim();
    }

    /**
     * @param value value typed by the user, may be blank
     * @param fallback value to use when it is blank
     * @return the sanitized value
     * @throws taller.multimedia.backend.exception.InvalidFieldException if the value is unsafe
     */
    private String displayValue(String value, String fallback) {
        String normalized = value == null ? "" : value.trim();
        return Sanitizer.requireClean("author", normalized.isBlank() ? fallback : normalized);
    }
}
