package taller.multimedia.backend.controller.vacancy;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.vacancy.VacancyRequest;
import taller.multimedia.backend.dto.vacancy.VacancyResponse;
import taller.multimedia.backend.service.vacancy.VacancyService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/vacancies")
@RequiredArgsConstructor
public class VacancyController {

    private final VacancyService vacancyService;

    @GetMapping
    public ResponseEntity<List<VacancyResponse>> getAllVacancies() {
        return ResponseEntity.ok(vacancyService.getAllVacancies());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<VacancyResponse> createVacancy(@Valid @RequestBody VacancyRequest request) {
        VacancyResponse created = vacancyService.createVacancy(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<VacancyResponse> setOpen(
            @PathVariable UUID id,
            @RequestParam boolean isOpen) {
        return ResponseEntity.ok(vacancyService.setOpen(id, isOpen));
    }

    @PatchMapping("/{id}/filled-by")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<VacancyResponse> setFilledBy(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID applicationId) {
        return ResponseEntity.ok(vacancyService.setFilledBy(id, applicationId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deleteVacancy(@PathVariable UUID id) {
        vacancyService.deleteVacancy(id);
        return ResponseEntity.noContent().build();
    }
}
