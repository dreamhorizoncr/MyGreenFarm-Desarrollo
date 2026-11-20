package taller.multimedia.backend.service.vacancy;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.vacancy.VacancyRequest;
import taller.multimedia.backend.dto.vacancy.VacancyResponse;
import taller.multimedia.backend.model.vacancy.Vacancy;
import taller.multimedia.backend.repository.vacancy.VacancyRepository;
import taller.multimedia.backend.util.Sanitizer;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Job openings published on the vacancies page. The list of fields an applicant must fill in is
 * stored as comma-separated text.
 */
@Service
@RequiredArgsConstructor
public class VacancyService {

    private final VacancyRepository vacancyRepository;

    /**
     * @param request title, description (both sanitized) and the fields applicants must fill in
     * @return the created vacancy, open by default
     * @throws taller.multimedia.backend.exception.InvalidFieldException if the title or description is unsafe
     */
    @Transactional
    public VacancyResponse createVacancy(VacancyRequest request) {
        Vacancy vacancy = new Vacancy();
        vacancy.setTitle(Sanitizer.requireClean("title", request.getTitle()));
        vacancy.setDescription(Sanitizer.requireClean("description", request.getDescription()));
        vacancy.setRequiredFields(toCsv(request.getRequiredFields()));

        Vacancy saved = vacancyRepository.save(vacancy);
        return mapToResponse(saved);
    }

    /**
     * @return all vacancies, open and closed
     */
    @Transactional(readOnly = true)
    public List<VacancyResponse> getAllVacancies() {
        return vacancyRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Opens or closes a vacancy.
     *
     * @param id vacancy ID
     * @param isOpen whether it accepts applications
     * @return the updated vacancy
     * @throws RuntimeException if the vacancy does not exist
     */
    @Transactional
    public VacancyResponse setOpen(UUID id, boolean isOpen) {
        Vacancy vacancy = findEntityById(id);
        vacancy.setOpen(isOpen);

        Vacancy saved = vacancyRepository.save(vacancy);
        return mapToResponse(saved);
    }

    /**
     * Records which application filled a vacancy. Setting an application closes the vacancy;
     * clearing it reopens it.
     *
     * @param id vacancy ID
     * @param applicationId hired application, or {@code null} to reopen the vacancy
     * @return the updated vacancy
     * @throws RuntimeException if the vacancy does not exist
     */
    @Transactional
    public VacancyResponse setFilledBy(UUID id, UUID applicationId) {
        Vacancy vacancy = findEntityById(id);
        vacancy.setFilledByApplicationId(applicationId);
        vacancy.setOpen(applicationId == null);

        Vacancy saved = vacancyRepository.save(vacancy);
        return mapToResponse(saved);
    }

    /**
     * @param id vacancy to delete
     * @throws RuntimeException if the vacancy does not exist
     */
    @Transactional
    public void deleteVacancy(UUID id) {
        Vacancy vacancy = findEntityById(id);
        vacancyRepository.delete(vacancy);
    }

    private Vacancy findEntityById(UUID id) {
        return vacancyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job opening not found with ID: " + id));
    }

    private String toCsv(List<String> values) {
        if (values == null || values.isEmpty()) return "";
        return String.join(",", values);
    }

    private List<String> fromCsv(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(",")).collect(Collectors.toList());
    }

    private VacancyResponse mapToResponse(Vacancy vacancy) {
        return VacancyResponse.builder()
                .id(vacancy.getId())
                .title(vacancy.getTitle())
                .description(vacancy.getDescription())
                .open(vacancy.isOpen())
                .createdAt(vacancy.getCreatedAt())
                .filledByApplicationId(vacancy.getFilledByApplicationId())
                .requiredFields(fromCsv(vacancy.getRequiredFields()))
                .build();
    }
}
