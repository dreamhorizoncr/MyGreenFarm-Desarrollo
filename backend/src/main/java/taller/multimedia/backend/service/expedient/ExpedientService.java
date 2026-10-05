package taller.multimedia.backend.service.expedient;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.expedient.ExpedientRequest;
import taller.multimedia.backend.dto.expedient.ExpedientResponse;
import taller.multimedia.backend.model.child.Child;
import taller.multimedia.backend.model.expedient.Expedient;
import taller.multimedia.backend.repository.child.ChildRepository;
import taller.multimedia.backend.repository.expedient.ExpedientRepository;
import taller.multimedia.backend.service.StorageService;
import taller.multimedia.backend.util.Sanitizer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.EntityNotFoundException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpedientService {

    private final ExpedientRepository expedientRepository;
    private final ChildRepository childRepository;

    private final StorageService storageService;

    @Value("${supabase.s3.buckets.expedients}")
    private String expedientsBucket;

    @Transactional
    public ExpedientResponse createExpedient(ExpedientRequest request, MultipartFile file) {
        String studentId = Sanitizer.requireClean("studentId", request.getStudentId());

        // 1. Buscar el estudiante por su studentId
        Child child = childRepository.findByStudentId(studentId)
                .orElseThrow(
                        () -> new EntityNotFoundException("Niño no encontrado con el carné/studentId: " + studentId));

        // 2. Verificar que no tenga ya un expediente asignado
        if (expedientRepository.existsByChildStudentId(child.getStudentId())) {
            throw new IllegalStateException("Ya existe un expediente registrado para el niño: "
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
                throw new IllegalArgumentException("Formato de imagen no permitido.");
            }
            String fileUrl = storageService.uploadFile(file, expedientsBucket, "child_photos");
            expedient.setPhotoUrl(fileUrl);
        }

        Expedient saved = expedientRepository.save(expedient);
        return mapToResponse(saved);
    }

    public String getSignedPhotoUrl(String filePath) {
        return storageService.getSignedUrl(expedientsBucket, filePath, 3600); // 1 hora de duración
    }

    @Transactional(readOnly = true)
    public List<ExpedientResponse> getAllExpedients() {
        return expedientRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExpedientResponse getExpedientById(UUID id) {
        Expedient expedient = expedientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado con ID: " + id));
        return mapToResponse(expedient);
    }

    private Expedient findEntityById(UUID id) {
        return expedientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado con ID: " + id));
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
                    System.err.println("No se pudo borrar la foto del bucket: " + e.getMessage());
                }
            }
        }

        expedientRepository.delete(expedient);
    }

    // Photo section

    @Transactional
    public ExpedientResponse uploadOrUpdatePhoto(UUID expedientId, ExpedientRequest request, MultipartFile file) {
        Expedient existing = findEntityById(expedientId);

        if (request.getStudentId() != null && !request.getStudentId().isBlank()) {
            String newStudentId = Sanitizer.requireClean("studentId", request.getStudentId());

            if (!existing.getChild().getStudentId().equals(newStudentId)) {
                Child newChild = childRepository.findByStudentId(newStudentId)
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Niño no encontrado con el carné/studentId: " + newStudentId));

                if (expedientRepository.existsByChildStudentId(newChild.getStudentId())) {
                    throw new IllegalStateException("Ya existe otro expediente registrado para el niño especificado.");
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
                throw new IllegalArgumentException("Formato no permitido. Solo se aceptan PNG, JPG, JPEG, SVG.");
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
            throw new IllegalStateException("El expediente no tiene ninguna fotografía registrada.");
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
            System.err.println("Error al extraer la ruta de la URL: " + e.getMessage());
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