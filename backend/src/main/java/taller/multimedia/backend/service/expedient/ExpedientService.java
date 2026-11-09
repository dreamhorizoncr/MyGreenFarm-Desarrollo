package taller.multimedia.backend.service.expedient;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.expedient.ExpedientRequest;
import taller.multimedia.backend.dto.expedient.ExpedientResponse;
import taller.multimedia.backend.model.child.Child;
import taller.multimedia.backend.model.expedient.Expedient;
import taller.multimedia.backend.repository.child.ChildRepository;
import taller.multimedia.backend.repository.expedient.ExpedientRepository;
import taller.multimedia.backend.repository.evaluation.EvaluationRepository;
import taller.multimedia.backend.service.StorageService;
import taller.multimedia.backend.util.Sanitizer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import jakarta.persistence.EntityNotFoundException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExpedientService {

    private final ExpedientRepository expedientRepository;
    private final ChildRepository childRepository;
    private final EvaluationRepository evaluationRepository;

    private final StorageService storageService;

    @Value("${supabase.s3.buckets.expedients}")
    private String expedientsBucket;

    @Transactional
    public ExpedientResponse createExpedient(ExpedientRequest request, MultipartFile file) {
        String studentId = Sanitizer.requireClean("studentId", request.getStudentId());

        Child child = childRepository.findByStudentId(studentId)
                .orElseThrow(
                        () -> new EntityNotFoundException("Child not found with student ID: " + studentId));

        if (expedientRepository.existsByChildStudentId(child.getStudentId())) {
            throw new IllegalStateException("A record already exists for the child: "
                    + child.getFirstName() + " " + child.getLastName());
        }

        if (!Boolean.TRUE.equals(child.getIsActive())) {
            throw new IllegalStateException("A record cannot be created for the student '" 
                    + child.getFirstName() + " " + child.getLastName() + "' because they are inactive.");
        }

        if (expedientRepository.existsByChildStudentId(child.getStudentId())) {
        throw new IllegalStateException("A record already exists for the child: "
                + child.getFirstName() + " " + child.getLastName());
    }

        String generalObservations = request.getGeneralObservations() == null
                ? null
                : Sanitizer.requireClean("generalObservations", request.getGeneralObservations());

        Expedient expedient = new Expedient();
        expedient.setChild(child);
        expedient.setAdmisionDate(request.getAdmisionDate());
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

    public String getSignedPhotoUrl(String filePath) {
        return storageService.getSignedUrl(expedientsBucket, filePath, 3600);
    }

    @Transactional(readOnly = true)
    public Page<ExpedientResponse> getAllExpedients(Pageable pageable) {
        return expedientRepository.findByChildIsActiveTrue(pageable).map(this::mapToResponse);
    }

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

    @Transactional
    public void deleteExpedient(UUID id) {
        Expedient expedient = findEntityById(id);

        if (expedient.getPhotoUrl() != null && !expedient.getPhotoUrl().isEmpty()) {
            String filePath = extractPathFromUrl(expedient.getPhotoUrl(), expedientsBucket);
            if (filePath != null) {
                try {
                    storageService.deleteFile(expedientsBucket, filePath);
                } catch (Exception e) {
                    System.err.println("Could not delete the photo from the bucket: " + e.getMessage());
                }
            }
        }

        evaluationRepository.deleteAll(evaluationRepository.findByExpedientIdId(expedient.getId()));
        expedientRepository.delete(expedient);
    }

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
                    throw new IllegalStateException("The selected student is inactive.");
                }

                if (expedientRepository.existsByChildStudentId(newChild.getStudentId())) {
                    throw new IllegalStateException("Another record already exists for the specified child.");
                }
                existing.setChild(newChild);
            }
        }

        String generalObservations = request.getGeneralObservations() == null
                ? null
                : Sanitizer.requireClean("generalObservations", request.getGeneralObservations());

        existing.setAdmisionDate(request.getAdmisionDate());
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

    @Transactional
    public void deletePhoto(UUID expedientId) {
        Expedient expedient = findEntityById(expedientId);

        if (expedient.getPhotoUrl() == null || expedient.getPhotoUrl().isEmpty()) {
            throw new IllegalStateException("The record has no photo.");
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
            System.err.println("Error extracting the path from the URL: " + e.getMessage());
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
                .admisionDate(expedient.getAdmisionDate())
                .educationalLevel(expedient.getEducationalLevel())
                .generalObservations(expedient.getGeneralObservations())
                .photoUrl(signedPhotoUrl)
                .build();
    }
}