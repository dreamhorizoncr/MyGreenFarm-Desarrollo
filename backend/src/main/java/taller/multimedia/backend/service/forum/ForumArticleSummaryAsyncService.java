package taller.multimedia.backend.service.forum;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import taller.multimedia.backend.model.forum.ForumArticle;
import taller.multimedia.backend.repository.forum.ForumArticleRepository;
import taller.multimedia.backend.service.announcement.GeminiResumenService;
import taller.multimedia.backend.utils.HashUtils;

@Service
public class ForumArticleSummaryAsyncService {

    private static final Logger log = LoggerFactory.getLogger(ForumArticleSummaryAsyncService.class);

    private final ForumArticleRepository articleRepository;
    private final GeminiResumenService geminiResumenService;

    public ForumArticleSummaryAsyncService(
            ForumArticleRepository articleRepository,
            GeminiResumenService geminiResumenService) {
        this.articleRepository = articleRepository;
        this.geminiResumenService = geminiResumenService;
    }

    @Async("taskExecutor")
    @Transactional
    public void generateSummaryAsync(UUID articleId, boolean force) {
        try {
            ForumArticle article = articleRepository.findById(articleId)
                    .orElseThrow(() -> new RuntimeException("Artículo no encontrado: " + articleId));

            String contenidoHash = HashUtils.sha256(article.getContent());

            if (!force && contenidoHash.equals(article.getAiSummaryContentHash())) {
                return;
            }

            String resumen = geminiResumenService.generarResumenArticulo(article.getContent());
            if (resumen == null) {
                log.error("No se pudo generar el resumen IA para el artículo {}", articleId);
                return;
            }

            article.setAiSummary(resumen);
            article.setAiSummaryContentHash(contenidoHash);
            articleRepository.save(article);

            log.info("Resumen IA generado para el artículo {}", articleId);
        } catch (Exception e) {
            log.error("Error generando el resumen IA para el artículo {}", articleId, e);
        }
    }
}
