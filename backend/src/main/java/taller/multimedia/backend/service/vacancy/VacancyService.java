package taller.multimedia.backend.service.vacancy;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.vacancy.VacancyRequest;
import taller.multimedia.backend.dto.vacancy.VacancyResponse;
import taller.multimedia.backend.model.vacancy.Vacancy;
import taller.multimedia.backend.repository.vacancy.VacancyRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VacancyService {

    private final VacancyRepository vacancyRepository;

    @Transactional
    public VacancyResponse createVacancy(VacancyRequest request) {
        Vacancy vacancy = new Vacancy();
        vacancy.setTitle(request.getTitle());
        vacancy.setDescription(request.getDescription());
        vacancy.setRequiredFields(toCsv(request.getRequiredFields()));

        Vacancy saved = vacancyRepository.save(vacancy);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<VacancyResponse> getAllVacancies() {
        return vacancyRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public VacancyResponse setOpen(UUID id, boolean isOpen) {
        Vacancy vacancy = findEntityById(id);
        vacancy.setOpen(isOpen);

        Vacancy saved = vacancyRepository.save(vacancy);
        return mapToResponse(saved);
    }

    // Asignar una postulación cierra la vacante; liberarla (applicationId = null) la reabre
    @Transactional
    public VacancyResponse setFilledBy(UUID id, UUID applicationId) {
        Vacancy vacancy = findEntityById(id);
        vacancy.setFilledByApplicationId(applicationId);
        vacancy.setOpen(applicationId == null);

        Vacancy saved = vacancyRepository.save(vacancy);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteVacancy(UUID id) {
        Vacancy vacancy = findEntityById(id);
        vacancyRepository.delete(vacancy);
    }

    private Vacancy findEntityById(UUID id) {
        return vacancyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vacante no encontrada con ID: " + id));
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
