package taller.multimedia.backend.service.forum;

import taller.multimedia.backend.dto.forum.ForumArticleResponse;
import taller.multimedia.backend.dto.forum.ForumCommentResponse;
import org.apache.commons.text.StringEscapeUtils;
import org.springframework.stereotype.Component;

import taller.multimedia.backend.model.forum.ForumArticle;
import taller.multimedia.backend.model.forum.ForumComment;

/**
 * Converts forum entities into API responses. Texts are unescaped because older content was stored
 * with HTML entities.
 */
@Component
public class ForumMapper {

    /**
     * @param article stored article
     * @param reactionCount likes of the article
     * @param reacted whether the current visitor liked it
     * @param commentCount comments of the article
     * @return the response; the author fields are empty when the author was deleted
     */
    public ForumArticleResponse toArticleResponse(
            ForumArticle article,
            long reactionCount,
            boolean reacted,
            long commentCount) {
        boolean authorExists = article.getAuthor() != null;

        return ForumArticleResponse.builder()
                .id(article.getId())
                .title(article.getTitle())
                .topic(article.getTopic())
                .authorName(authorExists
                        ? StringEscapeUtils.unescapeHtml4(article.getAuthorName())
                        : null)
                .authorRole(authorExists ? article.getAuthorRole() : null)
                .content(article.getContent())
                .imageUrl(article.getImageUrl())
                .imageAlt(article.getImageAlt())
                .aiSummary(article.getAiSummary())
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .reactionCount((int) reactionCount)
                .reacted(reacted)
                .commentCount(commentCount)
                .build();
    }

    /**
     * @param comment stored comment
     * @return the response
     */
    public ForumCommentResponse toCommentResponse(ForumComment comment) {
        return ForumCommentResponse.builder()
                .id(comment.getId())
                .articleId(comment.getArticle().getId())
                .alias(StringEscapeUtils.unescapeHtml4(comment.getAlias()))
                .content(StringEscapeUtils.unescapeHtml4(comment.getContent()))
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
