package taller.multimedia.backend.dto.forum;

import org.apache.commons.text.StringEscapeUtils;
import org.springframework.stereotype.Component;

import taller.multimedia.backend.model.forum.ForumArticle;
import taller.multimedia.backend.model.forum.ForumComment;

@Component
public class ForumMapper {

    public ForumArticleResponse toArticleResponse(
            ForumArticle article,
            long reactionCount,
            boolean reacted,
            long commentCount) {
        return ForumArticleResponse.builder()
                .id(article.getId())
                .title(article.getTitle())
                .topic(article.getTopic())
                .authorName(StringEscapeUtils.unescapeHtml4(article.getAuthorName()))
                .authorRole(article.getAuthorRole())
                .content(article.getContent())
                .imageUrl(article.getImageUrl())
                .imageAlt(article.getImageAlt())
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .reactionCount((int) reactionCount)
                .reacted(reacted)
                .commentCount(commentCount)
                .build();
    }

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
