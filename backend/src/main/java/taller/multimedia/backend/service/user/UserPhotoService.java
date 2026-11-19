package taller.multimedia.backend.service.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import taller.multimedia.backend.dto.user.UserInfoResponse;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.user.UserRepository;
import taller.multimedia.backend.service.storage.StorageService;

import java.util.UUID;

/**
 * Profile photos of teachers, stored in the users bucket and shown on the About us page.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserPhotoService {

    private final UserRepository userRepository;
    private final StorageService storageService;

    @Value("${supabase.s3.buckets.users}")
    private String usersBucket;

    /**
     * Uploads a new photo for a teacher and deletes the previous one from storage. If the old file
     * cannot be deleted, the error is only logged and the new photo is still saved.
     *
     * @param userId teacher's user ID
     * @param file image in PNG, JPG, JPEG, WEBP or SVG format
     * @return the updated user
     * @throws RuntimeException if the user does not exist
     * @throws IllegalArgumentException if the user is not a teacher, the file is empty or its
     *     format is not allowed
     */
    @Transactional
    public UserInfoResponse uploadTeacherPhoto(UUID userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        if (user.getRole() != Role.TEACHER) {
            throw new IllegalArgumentException("Profile photos can only be assigned to users with the TEACHER role.");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("You must select a valid file.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !isValidImageFormat(contentType)) {
            throw new IllegalArgumentException("Unsupported image format. Only PNG, JPG, JPEG, WEBP and SVG are accepted.");
        }

        if (user.getPhotoUrl() != null && !user.getPhotoUrl().isBlank()) {
            String oldPath = extractPathFromUrl(user.getPhotoUrl(), usersBucket);
            if (oldPath != null && !oldPath.isEmpty()) {
                try {
                    storageService.deleteFile(usersBucket, oldPath);
                } catch (Exception e) {
                    log.warn("Could not delete the previous photo from the bucket: {}", e.getMessage());
                }
            }
        }

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
                saved.getPhotoUrl(),
                saved.isShowOnAboutUs());
    }

    /**
     * Deletes a user's photo from storage and clears it from the profile. Does nothing if the user
     * has no photo.
     *
     * @param userId user ID
     * @throws RuntimeException if the user does not exist
     */
    @Transactional
    public void deleteTeacherPhoto(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

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
                contentType.equals("image/webp") ||
                contentType.equals("image/svg+xml");
    }

    /**
     * @param fileUrl public URL of a stored file
     * @param bucketName bucket that contains the file
     * @return the file's path inside the bucket, or {@code null} if the URL does not belong to it
     */
    private String extractPathFromUrl(String fileUrl, String bucketName) {
        try {
            String marker = "/" + bucketName + "/";
            int index = fileUrl.indexOf(marker);
            if (index != -1) {
                return fileUrl.substring(index + marker.length());
            }
        } catch (Exception e) {
            log.warn("Error extracting the path from the photo URL: {}", e.getMessage());
        }
        return null;
    }
}