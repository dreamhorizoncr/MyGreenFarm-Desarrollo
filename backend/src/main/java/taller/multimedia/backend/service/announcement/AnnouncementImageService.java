package taller.multimedia.backend.service.announcement;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.util.ImageAltText;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import taller.multimedia.backend.dto.announcement.AnnouncementImageResponse;
import taller.multimedia.backend.model.announcement.Announcement;
import taller.multimedia.backend.model.announcement.AnnouncementImage;
import taller.multimedia.backend.repository.announcement.AnnouncementImageRepository;
import taller.multimedia.backend.repository.announcement.AnnouncementRepository;
import taller.multimedia.backend.service.storage.StorageService;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;

/**
 * Images of announcements: one optional cover and up to four images for the announcement's gallery.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnnouncementImageService {

    private final AnnouncementImageRepository imageRepository;
    private final AnnouncementRepository announcementRepository;
    private final StorageService storageService;

    @Value("${supabase.s3.buckets.announcements}")
    private String announcementsBucket;

    /**
     * Uploads images to an announcement. A new cover replaces the previous one, which is also
     * deleted from storage.
     *
     * @param announcementId announcement ID
     * @param files images in PNG, JPG, JPEG, WEBP or SVG format
     * @param isCover {@code true} to upload the cover (only one file allowed)
     * @param altTexts alternative texts in the same order as the files; missing ones are left empty
     * @return the saved images
     * @throws RuntimeException if the announcement does not exist
     * @throws IllegalArgumentException if there are no files, more than one cover or a format is
     *     not allowed
     * @throws IllegalStateException if the gallery would have more than four images
     */
    @Transactional
    public List<AnnouncementImageResponse> uploadImages(UUID announcementId, List<MultipartFile> files,
            boolean isCover, List<String> altTexts) {
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new RuntimeException("Announcement not found with ID: " + announcementId));

        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("You must select at least one file.");
        }

        if (isCover && files.size() > 1) {
            throw new IllegalArgumentException("Only one cover image can be set at a time.");
        }

        List<AnnouncementImage> existingImages = imageRepository.findByAnnouncementId(announcementId);
        long currentGalleryCount = existingImages.stream().filter(image -> !image.getIsCover()).count();

        if (!isCover && (currentGalleryCount + files.size() > 4)) {
            throw new IllegalStateException(
                    "Limit exceeded. A maximum of 4 images is allowed in the gallery. Current count: "
                            + currentGalleryCount);
        }

        if (isCover) {
            Optional<AnnouncementImage> existingCover = imageRepository
                    .findByAnnouncementIdAndIsCoverTrue(announcementId);
            if (existingCover.isPresent()) {
                String oldPath = extractPathFromUrl(existingCover.get().getFileUrl(), announcementsBucket);
                if (oldPath != null)
                    storageService.deleteFile(announcementsBucket, oldPath);
                imageRepository.delete(existingCover.get());
            }
        }

        List<AnnouncementImageResponse> responses = new java.util.ArrayList<>();
        String folder = isCover ? "cover_images" : "images_content";

        for (int index = 0; index < files.size(); index++) {
            MultipartFile file = files.get(index);
            String contentType = file.getContentType();
            if (contentType == null || !isValidImageFormat(contentType)) {
                throw new IllegalArgumentException(
                        "One of the files has an unsupported format. Only PNG, JPG, JPEG, WEBP and SVG are allowed.");
            }

            String fileUrl = storageService.uploadFile(file, announcementsBucket, folder);

            AnnouncementImage image = new AnnouncementImage();
            image.setAnnouncement(announcement);
            image.setFileUrl(fileUrl);
            image.setIsCover(isCover);
            image.setAltText(ImageAltText.at(altTexts, index));

            AnnouncementImage saved = imageRepository.save(image);
            responses.add(mapToResponse(saved));
        }

        return responses;
    }

    /**
     * @param imageId image ID
     * @param altText new alternative text; it is cleaned before saving
     * @throws RuntimeException if the image does not exist
     */
    @Transactional
    public void updateAltText(UUID imageId, String altText) {
        AnnouncementImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found with ID: " + imageId));
        image.setAltText(ImageAltText.clean(altText));
        imageRepository.save(image);
    }

    private boolean isValidImageFormat(String contentType) {
        return contentType.equals("image/png") ||
                contentType.equals("image/jpg") ||
                contentType.equals("image/jpeg") ||
                contentType.equals("image/webp") ||
                contentType.equals("image/svg+xml");
    }

    /**
     * @param announcementId announcement ID
     * @return the cover and gallery images of the announcement
     */
    @Transactional(readOnly = true)
    public List<AnnouncementImageResponse> getImagesByAnnouncement(UUID announcementId) {
        return imageRepository.findByAnnouncementId(announcementId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Deletes an image from storage and from the announcement.
     *
     * @param imageId image ID
     * @throws RuntimeException if the image does not exist
     */
    @Transactional
    public void deleteImage(UUID imageId) {
        AnnouncementImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found with ID: " + imageId));

        String fileUrl = image.getFileUrl();
        String filePath = extractPathFromUrl(fileUrl, announcementsBucket);

        if (filePath != null && !filePath.isEmpty()) {
            storageService.deleteFile(announcementsBucket, filePath);
        }

        imageRepository.delete(image);
    }

    /**
     * Deletes the files of all the images of an announcement from storage, before the announcement
     * itself is deleted. A file that cannot be deleted is logged and skipped.
     *
     * @param announcementId announcement ID
     */
    @Transactional
    public void deleteAllImagesByAnnouncement(UUID announcementId) {
        List<AnnouncementImage> images = imageRepository.findByAnnouncementId(announcementId);

        for (AnnouncementImage image : images) {
            String filePath = extractPathFromUrl(image.getFileUrl(), announcementsBucket);
            if (filePath != null && !filePath.isEmpty()) {
                try {
                    storageService.deleteFile(announcementsBucket, filePath);
                } catch (Exception e) {
                    log.warn("Could not delete the file from the bucket: {}", e.getMessage());
                }
            }
        }
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
            log.warn("Error extracting the path from the URL: {}", e.getMessage());
        }
        return null;
    }

    private AnnouncementImageResponse mapToResponse(AnnouncementImage image) {
        return AnnouncementImageResponse.builder()
                .id(image.getId())
                .announcementId(image.getAnnouncement().getId())
                .fileUrl(image.getFileUrl())
                .altText(image.getAltText())
                .isCover(image.getIsCover())
                .build();
    }
}