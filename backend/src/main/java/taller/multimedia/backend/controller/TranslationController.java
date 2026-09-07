package taller.multimedia.backend.controller;

import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import taller.multimedia.backend.dto.TranslationRequest;
import taller.multimedia.backend.service.translation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/translations")
@RequiredArgsConstructor
public class TranslationController {
    private final TranslationService translationService;

    @PostMapping
    public ResponseEntity<?> translate(@RequestBody TranslationRequest request)
            throws IOException {

        String translatedText = translationService.getOrTranslate(
                request.entityType(),
                request.entityId(),
                request.fieldName(),
                request.originalText(),
                request.targetLanguage());

        return ResponseEntity.ok(
                Map.of("translatedText", translatedText));
    }
}
