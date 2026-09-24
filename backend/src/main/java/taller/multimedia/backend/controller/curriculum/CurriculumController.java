package taller.multimedia.backend.controller.curriculum;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.curriculum.ApplicationRequest;
import taller.multimedia.backend.dto.curriculum.ApplicationResponse;
import taller.multimedia.backend.model.curriculum.CurriculumStatus;
import taller.multimedia.backend.service.curriculum.CurriculumService;
import tools.jackson.databind.ObjectMapper;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class CurriculumController {

    private final CurriculumService curriculumService;

    private final ObjectMapper objectMapper;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApplicationResponse> submitApplication(
            @RequestParam("data") String requestJson,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "certificates", required = false) List<MultipartFile> certificates) {

        try {
            ApplicationRequest request = objectMapper.readValue(requestJson, ApplicationRequest.class);
            ApplicationResponse created = curriculumService.submitApplication(
                    request, file, certificates == null ? Collections.emptyList() : certificates);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            throw new RuntimeException("Error al procesar la postulación: " + e.getMessage());
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<List<ApplicationResponse>> getAllApplications() {
        return ResponseEntity.ok(curriculumService.getAllApplications());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApplicationResponse> setStatus(
            @PathVariable UUID id,
            @RequestParam CurriculumStatus status) {
        return ResponseEntity.ok(curriculumService.setStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deleteApplication(@PathVariable UUID id) {
        curriculumService.deleteCurriculum(id);
        return ResponseEntity.noContent().build();
    }
}
