package taller.multimedia.backend.service.user;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import taller.multimedia.backend.dto.UserInfoResponse;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.user.UserRepository;
import taller.multimedia.backend.service.StorageService;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserPhotoService {

    private final UserRepository userRepository;
    private final StorageService storageService;

    @Value("${supabase.s3.buckets.users}")
    private String usersBucket;

    @Transactional
    public UserInfoResponse uploadTeacherPhoto(UUID userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + userId));

        if (user.getRole() != Role.TEACHER) {
            throw new IllegalArgumentException("Solo se pueden asignar fotos de perfil a usuarios con rol TEACHER.");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Debe seleccionar un archivo válido.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !isValidImageFormat(contentType)) {
            throw new IllegalArgumentException("Formato de imagen no permitido. Solo se aceptan PNG, JPG, JPEG, SVG.");
        }

        if (user.getPhotoUrl() != null && !user.getPhotoUrl().isBlank()) {
            String oldPath = extractPathFromUrl(user.getPhotoUrl(), usersBucket);
            if (oldPath != null && !oldPath.isEmpty()) {
                try {
                    storageService.deleteFile(usersBucket, oldPath);
                } catch (Exception e) {
                    System.err.println("No se pudo eliminar la foto anterior del bucket: " + e.getMessage());
                }
            }
        }

        // Guardar la foto en la carpeta 'teachers' dentro del bucket
        String fileUrl = storageService.uploadFile(file, usersBucket, "teachers");
        user.setPhotoUrl(fileUrl);

        User saved = userRepository.save(user);

        return new UserInfoResponse(
                saved.getId(),
                saved.getEmail(),
                saved.getFirstName(),
                saved.getLastName(),
                saved.getRole().name(),
                saved.getBirthday(),
                saved.getPhotoUrl());
    }

    @Transactional
    public void deleteTeacherPhoto(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + userId));

        if (user.getPhotoUrl() != null && !user.getPhotoUrl().isBlank()) {
            String filePath = extractPathFromUrl(user.getPhotoUrl(), usersBucket);
            if (filePath != null && !filePath.isEmpty()) {
                storageService.deleteFile(usersBucket, filePath);
            }
            user.setPhotoUrl(null);
            userRepository.save(user);
        }
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
            System.err.println("Error al extraer la ruta de la URL de la foto: " + e.getMessage());
        }
        return null;
    }
}