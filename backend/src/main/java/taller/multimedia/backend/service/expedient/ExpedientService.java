package taller.multimedia.backend.service.expedient;

import taller.multimedia.backend.util.SearchPattern;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.expedient.ExpedientRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.dto.expedient.ExpedientResponse;
import taller.multimedia.backend.model.child.Child;
import taller.multimedia.backend.model.expedient.Expedient;
import taller.multimedia.backend.repository.child.ChildRepository;
import taller.multimedia.backend.repository.expedient.ExpedientRepository;
import taller.multimedia.backend.repository.evaluation.EvaluationRepository;
import taller.multimedia.backend.service.storage.StorageService;
import taller.multimedia.backend.util.Sanitizer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import jakarta.persistence.EntityNotFoundException;

import java.util.UUID;
import lombok.extern.slf4j.Slf4j;

/**
 * Student records (expedients): admission date, educational level, observations and the child's
 * photo. Each child has at most one record. Photos are private; responses carry signed links that
 * work for one hour.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExpedientService {

    private final ExpedientRepository expedientRepository;
    private final ChildRepository childRepository;
    private final EvaluationRepository evaluationRepository;

    private final StorageService storageService;

    @Value("${supabase.s3.buckets.expedients}")
    private String expedientsBucket;

    /**
     * @param request student ID, admission date, level and observations (sanitized)
     * @param file child's photo, optional, in PNG, JPG, JPEG, WEBP or SVG format
     * @return the created record
     * @throws EntityNotFoundException if no child has that student ID
     * @throws IllegalStateException if the child already has a record or is inactive
     * @throws IllegalArgumentException if the photo format is not allowed
     * @throws taller.multimedia.backend.exception.InvalidFieldException if a text is unsafe
     */
    @Transactional
    public ExpedientResponse createExpedient(ExpedientRequest request, MultipartFile file) {
        String studentId = Sanitizer.requireClean("studentId", request.getStudentId());

        Child child = childRepository.findByStudentId(studentId)
                .orElseThrow(
                        () -> new EntityNotFoundException("Child not found with student ID: " + studentId));

        if (expedientRepository.existsByChildStudentId(child.getStudentId())) {
            throw new InvalidFieldException("studentId", "A record already exists for the child: "
                    + child.getFirstName() + " " + child.getLastName());
        }

        if (!Boolean.TRUE.equals(child.getIsActive())) {
            throw new InvalidFieldException("studentId", "A record cannot be created for the student '" 
                    + child.getFirstName() + " " + child.getLastName() + "' because they are inactive.");
        }

        String generalObservations = request.getGeneralObservations() == null
                ? null
                : Sanitizer.requireClean("generalObservations", request.getGeneralObservations());

        Expedient expedient = new Expedient();
        expedient.setChild(child);
        expedient.setAdmissionDate(request.getAdmissionDate());
        expedient.setEducationalLevel(request.getEducationalLevel());
        expedient.setGeneralObservations(generalObservations);

        if (file != null && !file.isEmpty()) {
            String contentType = file.getContentType();
            if (contentType == null || !isValidImageFormat(contentType)) {
                throw new IllegalArgumentException("Unsupported image format.");
            }
            String fileUrl = storageService.uploadFile(file, expedientsBucket, "child_photos");
            expedient.setPhotoUrl(fileUrl);
        }

        Expedient saved = expedientRepository.save(expedient);
        return mapToResponse(saved);
    }

    /**
     * @param filePath path of the photo inside the records bucket
     * @return a link to the photo valid for one hour
     */
    public String getSignedPhotoUrl(String filePath) {
        return storageService.getSignedUrl(expedientsBucket, filePath, 3600);
    }

    /**
     * @param pageable page to return
     * @return records of active children
     */
    @Transactional(readOnly = true)
    public Page<ExpedientResponse> getAllExpedients(Pageable pageable) {
        return getAllExpedients(pageable, null);
    }

    /**
     * @param pageable page to return
     * @param search text to look for in the child's name, student ID and observations, optional
     * @return records of active children, filtered by the text when there is one
     */
    @Transactional(readOnly = true)
    public Page<ExpedientResponse> getAllExpedients(Pageable pageable, String search) {
        return SearchPattern.of(search)
                .map(pattern -> expedientRepository.searchActive(pattern, pageable))
                .orElseGet(() -> expedientRepository.findByChildIsActiveTrue(pageable))
                .map(this::mapToResponse);
    }

    /**
     * @param childIds children the user may see
     * @param pageable page to return
     * @return records of those children that are active; used to limit what a teacher sees
     */
    @Transactional(readOnly = true)
    public Page<ExpedientResponse> getExpedientsForChildren(java.util.Set<Long> childIds, Pageable pageable) {
        return getExpedientsForChildren(childIds, pageable, null);
    }

    /**
     * @param childIds children the user may see
     * @param pageable page to return
     * @param search text to look for, as in {@link #getAllExpedients(Pageable, String)}, optional
     * @return records of those children that are active, filtered by the text when there is one
     */
    @Transactional(readOnly = true)
    public Page<ExpedientResponse> getExpedientsForChildren(java.util.Set<Long> childIds, Pageable pageable, String search) {
        if (childIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return SearchPattern.of(search)
                .map(pattern -> expedientRepository.searchActiveByChildIds(childIds, pattern, pageable))
                .orElseGet(() -> expedientRepository.findActiveByChildIds(childIds, pageable))
                .map(this::mapToResponse);
    }

    /**
     * @param expedientId record ID
     * @return the child the record belongs to, to check a teacher's access
     * @throws RuntimeException if the record does not exist
     */
    @Transactional(readOnly = true)
    public Long getChildId(UUID expedientId) {
        return findEntityById(expedientId).getChild().getId();
    }

    /**
     * @param studentId child's student ID
     * @return the child's record
     * @throws org.springframework.web.server.ResponseStatusException with 404 if the child has no record
     */
    @Transactional(readOnly = true)
    public ExpedientResponse getExpedientByStudentId(String studentId) {
        return expedientRepository.findByChildStudentId(studentId)
                .map(this::mapToResponse)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "This child has no record yet"));
    }

    /**
     * @param studentId child's student ID
     * @return the child's internal ID, if the student exists
     */
    @Transactional(readOnly = true)
    public java.util.Optional<Long> findChildIdByStudentId(String studentId) {
        return childRepository.findByStudentId(studentId).map(Child::getId);
    }

    /**
     * @param id record ID
     * @return the record
     * @throws RuntimeException if it does not exist
     */
    @Transactional(readOnly = true)
    public ExpedientResponse getExpedientById(UUID id) {
        Expedient expedient = expedientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Record not found with ID: " + id));
        return mapToResponse(expedient);
    }

    private Expedient findEntityById(UUID id) {
        return expedientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Record not found with ID: " + id));
    }

    /**
     * Deletes a record, its evaluations and its photo. If the photo cannot be deleted from storage,
     * the error is logged and the record is still deleted.
     *
     * @param id record ID
     * @throws RuntimeException if it does not exist
     */
    @Transactional
    public void deleteExpedient(UUID id) {
        Expedient expedient = findEntityById(id);

        if (expedient.getPhotoUrl() != null && !expedient.getPhotoUrl().isEmpty()) {
            String filePath = extractPathFromUrl(expedient.getPhotoUrl(), expedientsBucket);
            if (filePath != null) {
                try {
                    storageService.deleteFile(expedientsBucket, filePath);
                } catch (Exception e) {
                    log.warn("Could not delete the photo from the bucket: {}", e.getMessage());
                }
            }
        }

        evaluationRepository.deleteAll(evaluationRepository.findByExpedientId(expedient.getId()));
        expedientRepository.delete(expedient);
    }

    /**
     * Updates a record and, when a new photo is sent, replaces the old file in storage. The record
     * can also be moved to another child that has no record yet.
     *
     * @param expedientId record ID
     * @param request new data; a different student ID moves the record to that child
     * @param file new photo, optional
     * @return the updated record
     * @throws RuntimeException if the record does not exist
     * @throws EntityNotFoundException if the new student does not exist
     * @throws IllegalStateException if the new student is inactive or already has a record
     * @throws IllegalArgumentException if the photo format is not allowed
     */
    @Transactional
    public ExpedientResponse uploadOrUpdatePhoto(UUID expedientId, ExpedientRequest request, MultipartFile file) {
        Expedient existing = findEntityById(expedientId);

        if (request.getStudentId() != null && !request.getStudentId().isBlank()) {
            String newStudentId = Sanitizer.requireClean("studentId", request.getStudentId());

            if (!existing.getChild().getStudentId().equals(newStudentId)) {
                Child newChild = childRepository.findByStudentId(newStudentId)
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Child not found with student ID: " + newStudentId));

                if (!Boolean.TRUE.equals(newChild.getIsActive())) {
                    throw new InvalidFieldException("studentId", "The selected student is inactive.");
                }

                if (expedientRepository.existsByChildStudentId(newChild.getStudentId())) {
                    throw new InvalidFieldException("studentId", "Another record already exists for the specified child.");
                }
                existing.setChild(newChild);
            }
        }

        String generalObservations = request.getGeneralObservations() == null
                ? null
                : Sanitizer.requireClean("generalObservations", request.getGeneralObservations());

        existing.setAdmissionDate(request.getAdmissionDate());
        existing.setEducationalLevel(request.getEducationalLevel());
        existing.setGeneralObservations(generalObservations);

        if (file != null && !file.isEmpty()) {
            String contentType = file.getContentType();
            if (contentType == null || !isValidImageFormat(contentType)) {
                throw new IllegalArgumentException("Unsupported format. Only PNG, JPG, JPEG, WEBP and SVG are accepted.");
            }

            if (existing.getPhotoUrl() != null && !existing.getPhotoUrl().isEmpty()) {
                String oldPath = extractPathFromUrl(existing.getPhotoUrl(), expedientsBucket);
                if (oldPath != null) {
                    storageService.deleteFile(expedientsBucket, oldPath);
                }
            }

            String fileUrl = storageService.uploadFile(file, expedientsBucket, "child_photos");
            existing.setPhotoUrl(fileUrl);
        }

        Expedient saved = expedientRepository.save(existing);
        return mapToResponse(saved);
    }

    /**
     * @param expedientId record ID
     * @throws RuntimeException if the record does not exist
     * @throws IllegalStateException if the record has no photo
     */
    @Transactional
    public void deletePhoto(UUID expedientId) {
        Expedient expedient = findEntityById(expedientId);

        if (expedient.getPhotoUrl() == null || expedient.getPhotoUrl().isEmpty()) {
            throw new IllegalArgumentException("The record has no photo.");
        }

        String filePath = extractPathFromUrl(expedient.getPhotoUrl(), expedientsBucket);
        if (filePath != null) {
            storageService.deleteFile(expedientsBucket, filePath);
        }

        expedient.setPhotoUrl(null);
        expedientRepository.save(expedient);
    }

    private boolean isValidImageFormat(String contentType) {
        return contentType.equals("image/png") ||
                contentType.equals("image/jpg") ||
                contentType.equals("image/jpeg") ||
                contentType.equals("image/webp") ||
                contentType.equals("image/svg+xml");
    }

    private String extractPathFromUrl(String fileUrl, String bucketName) {
        try {
            String marker = "/" + bucketName + "/";
            int index = fileUrl.indexOf(marker);
            if (index != -1) {
                return fileUrl.substring(index + marker.length());
            }
        } catch (Exception e) {
            log.warn("Error extracting the path from the URL: {}", e.getMessage());
        }
        return null;
    }

    private ExpedientResponse mapToResponse(Expedient expedient) {
        String signedPhotoUrl = null;
        if (expedient.getPhotoUrl() != null && !expedient.getPhotoUrl().isEmpty()) {
            String filePath = extractPathFromUrl(expedient.getPhotoUrl(), expedientsBucket);
            if (filePath != null) {
                signedPhotoUrl = getSignedPhotoUrl(filePath);
            }
        }

        Child child = expedient.getChild();

        return ExpedientResponse.builder()
                .id(expedient.getId())
                .childId(child.getId())
                .studentId(child.getStudentId())
                .childName(child.getFirstName() + " " + child.getLastName())
                .admissionDate(expedient.getAdmissionDate())
                .educationalLevel(expedient.getEducationalLevel())
                .generalObservations(expedient.getGeneralObservations())
                .photoUrl(signedPhotoUrl)
                .build();
    }
}