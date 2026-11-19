package taller.multimedia.backend.controller.vacancy;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.vacancy.VacancyRequest;
import taller.multimedia.backend.dto.vacancy.VacancyResponse;
import taller.multimedia.backend.service.vacancy.VacancyService;
import taller.multimedia.backend.service.spelling.SpellingCorrectionAsyncService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Job openings. Reading is public; changes are for the owner and admins.
 */
@RestController
@RequestMapping("/api/vacancies")
@RequiredArgsConstructor
public class VacancyController {

    private final VacancyService vacancyService;
    private final SpellingCorrectionAsyncService spellingCorrectionAsyncService;

    /**
     * {@code GET /api/vacancies}
     *
     * @return all vacancies, open and closed
     */
    @GetMapping
    public ResponseEntity<List<VacancyResponse>> getAllVacancies() {
        return ResponseEntity.ok(vacancyService.getAllVacancies());
    }

    /**
     * {@code POST /api/vacancies}: creates a vacancy and corrects its spelling in the background.
     *
     * @param request vacancy data
     * @return 201 with the created vacancy
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<VacancyResponse> createVacancy(@Valid @RequestBody VacancyRequest request) {
        VacancyResponse created = vacancyService.createVacancy(request);
        spellingCorrectionAsyncService.correctVacancy(created.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * {@code PATCH /api/vacancies/{id}/status}
     *
     * @param id vacancy ID
     * @param isOpen whether it accepts applications
     * @return the updated vacancy
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<VacancyResponse> setOpen(
            @PathVariable UUID id,
            @RequestParam boolean isOpen) {
        return ResponseEntity.ok(vacancyService.setOpen(id, isOpen));
    }

    /**
     * {@code PATCH /api/vacancies/{id}/filled-by}: records the hired application and closes the
     * vacancy, or reopens it without one.
     *
     * @param id vacancy ID
     * @param applicationId hired application, optional
     * @return the updated vacancy
     */
    @PatchMapping("/{id}/filled-by")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<VacancyResponse> setFilledBy(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID applicationId) {
        return ResponseEntity.ok(vacancyService.setFilledBy(id, applicationId));
    }

    /**
     * {@code DELETE /api/vacancies/{id}}
     *
     * @param id vacancy ID
     * @return 204
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deleteVacancy(@PathVariable UUID id) {
        vacancyService.deleteVacancy(id);
        return ResponseEntity.noContent().build();
    }
}
