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

/**
 * Extracurricular clubs. The free spots of a club are its maximum capacity minus the children
 * enrolled in it.
 */
@Service
@RequiredArgsConstructor
public class ClubService {

    private final ClubImageService clubImageService;
    private final ClubRepository clubRepository;
    private final ChildClubRepository childClubRepository;

    /**
     * @param request club data; texts are sanitized and the description keeps its line breaks
     * @return the created club, with all its spots free
     * @throws IllegalArgumentException if another club has the same name (case-insensitive)
     * @throws taller.multimedia.backend.exception.InvalidFieldException if a text is unsafe
     */
    @Transactional
    public ClubResponse create(ClubRequest request) {
        Club saved = createClub(request);
        return mapToResponse(saved, "es");
    }

    /**
     * Creates a club and uploads its cover and content images in the same transaction.
     *
     * @param request club data
     * @param coverImage cover image, optional
     * @param contentImages content images, optional
     * @param coverAlt alternative text of the cover
     * @param contentAlts alternative texts of the content images, in the same order
     * @return the created club with its images
     * @throws IllegalArgumentException if the name is taken or an image is not valid
     * @throws taller.multimedia.backend.exception.InvalidFieldException if a text is unsafe
     */
    @Transactional
    public ClubResponse createWithImages(ClubRequest request, MultipartFile coverImage, List<MultipartFile> contentImages,
            String coverAlt, List<String> contentAlts) {
        Club saved = createClub(request);

        if (coverImage != null && !coverImage.isEmpty()) {
            clubImageService.uploadImages(saved.getId(), List.of(coverImage), true, coverAlt == null ? List.of() : List.of(coverAlt));
        }
        if (contentImages != null && !contentImages.isEmpty()) {
            clubImageService.uploadImages(saved.getId(), contentImages, false, contentAlts);
        }

        return mapToResponse(saved, "es");
    }

    private Club createClub(ClubRequest request) {
        String name = Sanitizer.requireClean("name", request.getName());
        String description = request.getDescription() == null ? null
                : Sanitizer.requireCleanPreserveLineBreaks("description", request.getDescription());
        String schedule = request.getSchedule() == null ? null : Sanitizer.requireClean("schedule", request.getSchedule());

        if (clubRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("A club already exists with the name: " + name);
        }

        Club club = new Club();
        club.setName(name);
        club.setDescription(description);
        club.setSchedule(schedule);
        club.setMaxCapacity(request.getMaxCapacity());
        club.setAvailableSpots(request.getMaxCapacity());
        club.setPublished(request.getIsPublished() != null && request.getIsPublished());

        return clubRepository.save(club);
    }

    /**
     * @param lang requested language
     * @param pageable page to return
     * @return all clubs, published or not; for the admin panel
     */
    @Transactional(readOnly = true)
    public Page<ClubResponse> getAll(String lang, Pageable pageable) {
        return clubRepository.findAll(pageable)
                .map(club -> mapToResponse(club, lang));
    }

    /**
     * @param lang requested language
     * @return published clubs that still have free spots
     */
    @Transactional(readOnly = true)
    public List<ClubResponse> getAvailableClubs(String lang) {
        return clubRepository.findAllPublishedClubs()
                .stream()
                .map(club -> mapToResponse(club, lang))
                .filter(club -> club.getAvailableSpots() != null && club.getAvailableSpots() > 0)
                .toList();
    }

    /**
     * @param id club ID
     * @param lang requested language
     * @return the club with its images
     * @throws EntityNotFoundException if it does not exist
     */
    @Transactional(readOnly = true)
    public ClubResponse getById(Long id, String lang) {
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Club not found with ID: " + id));
        return mapToResponse(club, lang);
    }

    /**
     * Updates a club. When the capacity changes, the free spots are recalculated from the children
     * already enrolled (never below zero).
     *
     * @param id club ID
     * @param request new data; {@code maxCapacity} and {@code isPublished} are only changed when
     *     sent
     * @return the updated club
     * @throws EntityNotFoundException if the club does not exist
     * @throws IllegalArgumentException if another club has the same name
     * @throws taller.multimedia.backend.exception.InvalidFieldException if a text is unsafe
     */
    @Transactional
    public ClubResponse update(Long id, ClubRequest request) {
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Club not found with ID: " + id));

        String name = Sanitizer.requireClean("name", request.getName());
        String description = request.getDescription() == null ? null
                : Sanitizer.requireCleanPreserveLineBreaks("description", request.getDescription());
        String schedule = request.getSchedule() == null ? null : Sanitizer.requireClean("schedule", request.getSchedule());

        if (clubRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new IllegalArgumentException("A club already exists with the name: " + name);
        }

        if (request.getMaxCapacity() != null && !request.getMaxCapacity().equals(club.getMaxCapacity())) {
            club.setMaxCapacity(request.getMaxCapacity());
            long enrolledChildren = childClubRepository.countByClubId(id);
            int calculatedSpots = (int) (request.getMaxCapacity() - enrolledChildren);
            club.setAvailableSpots(Math.max(0, calculatedSpots));
        }

        if (request.getIsPublished() != null) {
            club.setPublished(request.getIsPublished());
        }

        club.setName(name);
        club.setDescription(description);
        club.setSchedule(schedule);
        Club updated = clubRepository.save(club);
        return mapToResponse(updated, "es");
    }

    /**
     * Deletes a club, its enrollments and its images.
     *
     * @param id club ID
     * @throws EntityNotFoundException if it does not exist
     */
    @Transactional
    public void delete(Long id) {
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Club not found with ID: " + id));

        childClubRepository.deleteByClubId(id);

        clubImageService.deleteAllImagesByClub(id);

        if (club.getImages() != null) {
            club.getImages().clear();
        }

        if (club.getChildClubs() != null) {
            club.getChildClubs().clear();
        }

        clubRepository.delete(club);
    }

    /**
     * Recalculates the free spots of a club after its enrollments changed. Clubs without a capacity
     * are not changed.
     *
     * @param clubId club ID
     * @throws EntityNotFoundException if it does not exist
     */
    public void updateAvailableSpots(Long clubId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("Club not found"));
        long enrolled = childClubRepository.countByClubId(clubId);
        if (club.getMaxCapacity() != null) {
            club.setAvailableSpots((int) Math.max(0, club.getMaxCapacity() - enrolled));
            clubRepository.save(club);
        }
    }

    /**
     * @param club entity
     * @param lang requested language
     * @return the response with the current free spots and the club's images
     */
    private ClubResponse mapToResponse(Club club, String lang) {
        ClubResponse response = new ClubResponse();
        response.setId(club.getId());
        response.setSchedule(club.getSchedule());
        response.setMaxCapacity(club.getMaxCapacity());
        response.setPublished(club.isPublished());


        response.setName(club.getName());

        response.setDescription(club.getDescription());

        long enrolledChildren = childClubRepository.countByClubId(club.getId());

        if (club.getMaxCapacity() != null) {
            int calculatedSpots = (int) (club.getMaxCapacity() - enrolledChildren);
            response.setAvailableSpots(Math.max(0, calculatedSpots));
        } else {
            response.setAvailableSpots(null);
        }

        List<ClubImageResponse> images = clubImageService.getImagesByClub(club.getId());
        response.setImages(images);

        return response;
    }
}
