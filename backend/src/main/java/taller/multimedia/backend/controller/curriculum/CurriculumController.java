package taller.multimedia.backend.controller.curriculum;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.curriculum.ApplicationRequest;
import taller.multimedia.backend.dto.curriculum.ApplicationResponse;
import taller.multimedia.backend.exception.InvalidFieldException;
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

/**
 * Job applications. Anyone may apply; reviewing applications is for the owner and admins.
 */
@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class CurriculumController {

    private final CurriculumService curriculumService;

    private final ObjectMapper objectMapper;

    /**
     * {@code POST /api/applications}, multipart.
     *
     * @param requestJson applicant's data as JSON
     * @param file CV in PDF format, optional
     * @param certificates certificates, optional
     * @return 201 with the saved application
     * @throws InvalidFieldException if a field is invalid
     * @throws RuntimeException if the data cannot be read or the files cannot be processed
     */
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
        } catch (InvalidFieldException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error processing the application: " + e.getMessage(), e);
        }
    }

    /**
     * {@code GET /api/applications}
     *
     * @return all applications with temporary links to their files
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<List<ApplicationResponse>> getAllApplications() {
        return ResponseEntity.ok(curriculumService.getAllApplications());
    }

    /**
     * {@code PATCH /api/applications/{id}/status}
     *
     * @param id application ID
     * @param status new status
     * @param lang language for the hired email when the application has none
     * @param vacancyId vacancy to assign when approving an open application, optional
     * @return the updated application
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApplicationResponse> setStatus(
            @PathVariable UUID id,
            @RequestParam CurriculumStatus status,
            @RequestParam(required = false, defaultValue = "es") String lang,
            @RequestParam(required = false) UUID vacancyId) {
        return ResponseEntity.ok(curriculumService.setStatus(id, status, lang, vacancyId));
    }

    /**
     * {@code DELETE /api/applications/{id}}: deletes the application and its files.
     *
     * @param id application ID
     * @return 204
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deleteApplication(@PathVariable UUID id) {
        curriculumService.deleteCurriculum(id);
        return ResponseEntity.noContent().build();
    }
}
