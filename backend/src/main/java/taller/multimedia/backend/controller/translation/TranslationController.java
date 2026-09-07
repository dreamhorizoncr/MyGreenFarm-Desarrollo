package taller.multimedia.backend.controller.translation;

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

@RestController
@RequestMapping("/api/translations")
@RequiredArgsConstructor
public class TranslationController {
        private final TranslationService translationService;

        @PostMapping
        public ResponseEntity<String> translate(@RequestBody TranslationRequest request) throws IOException {
                String result = translationService.getOrTranslate(
                                request.entityType(), request.entityId(), request.fieldName(),
                                request.originalText(), request.targetLanguage());
                return ResponseEntity.ok(result);
        }

        @PostMapping("/batch")
        public ResponseEntity<Map<String, String>> translateBatch(@RequestBody TranslationBatchRequest request)
                        throws IOException {
                Map<String, String> result = translationService.getOrTranslateBatch(
                                request.entityType(),  request.items(), request.targetLanguage());
                return ResponseEntity.ok(result);
        }
}
