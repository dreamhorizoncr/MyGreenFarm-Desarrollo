package taller.multimedia.backend.service.forum;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import taller.multimedia.backend.model.forum.ForumArticle;
import taller.multimedia.backend.repository.forum.ForumArticleRepository;
import taller.multimedia.backend.service.announcement.GeminiSummaryService;
import taller.multimedia.backend.util.HashUtils;

/**
 * Generates the AI summary of forum articles in the background so publishing an article does not
 * wait for the AI provider.
 */
@Service
public class ForumArticleSummaryAsyncService {

    private static final Logger log = LoggerFactory.getLogger(ForumArticleSummaryAsyncService.class);

    private final ForumArticleRepository articleRepository;
    private final GeminiSummaryService geminiSummaryService;

    public ForumArticleSummaryAsyncService(
            ForumArticleRepository articleRepository,
            GeminiSummaryService geminiSummaryService) {
        this.articleRepository = articleRepository;
        this.geminiSummaryService = geminiSummaryService;
    }

    /**
     * Generates and stores the AI summary of an article on the {@code taskExecutor} thread pool.
     *
     * <p>The summary is only regenerated when the article content changed since the last summary
     * (compared by SHA-256 hash) or when {@code force} is set. Errors are logged and never
     * propagated, because nobody waits for this task.
     *
     * @param articleId article to summarize
     * @param force {@code true} to regenerate even if the content did not change
     */
    @Async("taskExecutor")
    @Transactional
    public void generateSummaryAsync(UUID articleId, boolean force) {
        try {
            ForumArticle article = articleRepository.findById(articleId)
                    .orElseThrow(() -> new RuntimeException("Article not found: " + articleId));

            String contentHash = HashUtils.sha256(article.getContent());

            if (!force && contentHash.equals(article.getAiSummaryContentHash())) {
                return;
            }

            String summary = geminiSummaryService.generateArticleSummary(article.getContent());
            if (summary == null) {
                log.error("Could not generate the AI summary for article {}", articleId);
                return;
            }

            article.setAiSummary(summary);
            article.setAiSummaryContentHash(contentHash);
            articleRepository.save(article);

            log.info("AI summary generated for article {}", articleId);
        } catch (Exception e) {
            log.error("Error generating the AI summary for article {}", articleId, e);
        }
    }
}
