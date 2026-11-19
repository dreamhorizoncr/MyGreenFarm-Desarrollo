package taller.multimedia.backend.controller.translation;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import taller.multimedia.backend.dto.translation.TranslationRequest;
import taller.multimedia.backend.service.translation.*;
import taller.multimedia.backend.dto.translation.TranslationBatchRequest;

import java.io.IOException;
import java.util.Map;

/**
 * Public translation of site content to the visitor's language, with the translations cached in the
 * database.
 */
@RestController
@RequestMapping("/api/translations")
@RequiredArgsConstructor
public class TranslationController {
        private final TranslationService translationService;

        /**
         * {@code POST /api/translations}
         *
         * @param request field to translate
         * @return the translated text
         * @throws IOException if Google Translation fails
         */
        @PostMapping
        public ResponseEntity<String> translate(@Valid @RequestBody TranslationRequest request) throws IOException {
                String result = translationService.getOrTranslate(
                                request.entityType(), request.entityId(), request.fieldName(),
                                request.originalText(), request.targetLanguage());
                return ResponseEntity.ok(result);
        }

        /**
         * {@code POST /api/translations/batch}
         *
         * @param request fields to translate
         * @return translations by {@code entityId:fieldName}
         * @throws IOException if Google Translation fails
         */
        @PostMapping("/batch")
        public ResponseEntity<Map<String, String>> translateBatch(@Valid @RequestBody TranslationBatchRequest request)
                        throws IOException {
                Map<String, String> result = translationService.getOrTranslateBatch(
                                request.entityType(),  request.items(), request.targetLanguage());
                return ResponseEntity.ok(result);
        }
}
