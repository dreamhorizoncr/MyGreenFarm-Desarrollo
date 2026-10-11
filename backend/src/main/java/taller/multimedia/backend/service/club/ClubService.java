package taller.multimedia.backend.service.club;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.club.ClubImageResponse;
import taller.multimedia.backend.dto.club.ClubRequest;
import taller.multimedia.backend.dto.club.ClubResponse;
import taller.multimedia.backend.model.club.Club;
import taller.multimedia.backend.repository.child.ChildClubRepository;
import taller.multimedia.backend.repository.club.ClubRepository;
import taller.multimedia.backend.util.Sanitizer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClubService {

    private final ClubImageService clubImageService;
    private final ClubRepository clubRepository;
    private final ChildClubRepository childRepository;

    @Transactional
    public ClubResponse create(ClubRequest dto) {
        Club saved = createClub(dto);
        return mapToResponse(saved, "es"); // Por defecto se crea en español
    }

    @Transactional
    public ClubResponse createWithImages(ClubRequest dto, MultipartFile coverImage, List<MultipartFile> contentImages) {
        Club saved = createClub(dto);

        if (coverImage != null && !coverImage.isEmpty()) {
            clubImageService.uploadImages(saved.getId(), List.of(coverImage), true);
        }
        if (contentImages != null && !contentImages.isEmpty()) {
            clubImageService.uploadImages(saved.getId(), contentImages, false);
        }

        return mapToResponse(saved, "es");
    }

    private Club createClub(ClubRequest dto) {
        String name = Sanitizer.requireClean("name", dto.getName());
        String description = dto.getDescription() == null ? null
                : Sanitizer.requireCleanPreserveLineBreaks("description", dto.getDescription());
        String schedule = dto.getSchedule() == null ? null : Sanitizer.requireClean("schedule", dto.getSchedule());

        if (clubRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Ya existe un club con el nombre: " + name);
        }

        Club club = new Club();
        club.setName(name);
        club.setDescription(description);
        club.setSchedule(schedule);
        club.setMaxCapacity(dto.getMaxCapacity());
        club.setAvailableSpots(dto.getMaxCapacity());
        club.setPublished(dto.getIsPublished() != null && dto.getIsPublished());

        return clubRepository.save(club);
    }

    @Transactional(readOnly = true)
    public Page<ClubResponse> getAll(String lang, Pageable pageable) {
        return clubRepository.findAll(pageable)
                .map(club -> mapToResponse(club, lang));
    }

    @Transactional(readOnly = true)
    public ClubResponse getById(Long id, String lang) {
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Club no encontrado con ID: " + id));
        return mapToResponse(club, lang);
    }

    @Transactional
    public ClubResponse update(Long id, ClubRequest dto) {
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Club no encontrado con ID: " + id));

        String name = Sanitizer.requireClean("name", dto.getName());
        String description = dto.getDescription() == null ? null
                : Sanitizer.requireCleanPreserveLineBreaks("description", dto.getDescription());
        String schedule = dto.getSchedule() == null ? null : Sanitizer.requireClean("schedule", dto.getSchedule());

        if (clubRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new IllegalArgumentException("Ya existe un club con el nombre: " + name);
        }

        if (dto.getMaxCapacity() != null && !dto.getMaxCapacity().equals(club.getMaxCapacity())) {
            club.setMaxCapacity(dto.getMaxCapacity());
            long enrolledChildren = childRepository.countByClubId(id);
            int calculatedSpots = (int) (dto.getMaxCapacity() - enrolledChildren);
            club.setAvailableSpots(Math.max(0, calculatedSpots));
        }

        if (dto.getIsPublished() != null) {
            club.setPublished(dto.getIsPublished());
        }

        club.setName(name);
        club.setDescription(description);
        club.setSchedule(schedule);

        if (dto.getIsPublished() != null) {
            club.setPublished(dto.getIsPublished());
        }

        Club updated = clubRepository.save(club);
        return mapToResponse(updated, "es");
    }

    @Transactional
    public void delete(Long id) {
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Club no encontrado con ID: " + id));

        childRepository.deleteByClubId(id);

        clubImageService.deleteAllImagesByClub(id);

        if (club.getImages() != null) {
            club.getImages().clear();
        }

        if (club.getChildClubs() != null) {
            club.getChildClubs().clear();
        }

        clubRepository.delete(club);
    }

    public void updateAvailableSpots(Long clubId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("Club no encontrado"));
        long enrolled = childRepository.countByClubId(clubId);
        if (club.getMaxCapacity() != null) {
            club.setAvailableSpots((int) Math.max(0, club.getMaxCapacity() - enrolled));
            clubRepository.save(club);
        }
    }

    // Método auxiliar para transformar la entidad al DTO de respuesta y cargar sus
    // imágenes
    private ClubResponse mapToResponse(Club club, String lang) {
        ClubResponse response = new ClubResponse();
        response.setId(club.getId());
        response.setSchedule(club.getSchedule());
        response.setMaxCapacity(club.getMaxCapacity());
        response.setPublished(club.isPublished());

        // Lógica de traducción de contenido
        if ("en".equals(lang) || "fr".equals(lang)) {
            response.setName(club.getName()); // Placeholder temporal para i18n
            response.setDescription(club.getDescription());
        } else {
            response.setName(club.getName());
            response.setDescription(club.getDescription());
        }

        long enrolledChildren = childRepository.countByClubId(club.getId());

        // 2. Calcular o asignar los cupos disponibles reales (maxCapacity - inscritos)
        if (club.getMaxCapacity() != null) {
            int calculatedSpots = (int) (club.getMaxCapacity() - enrolledChildren);
            response.setAvailableSpots(Math.max(0, calculatedSpots));
        } else {
            response.setAvailableSpots(null);
        }

        // Obtener la galería de imágenes correspondiente al club
        List<ClubImageResponse> images = clubImageService.getImagesByClub(club.getId());
        response.setImages(images);

        return response;
    }
}
