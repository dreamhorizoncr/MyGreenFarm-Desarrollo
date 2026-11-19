package taller.multimedia.backend.service.gallery;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.util.ImageAltText;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import taller.multimedia.backend.dto.gallery.GalleryImageResponse;
import taller.multimedia.backend.model.gallery.Gallery;
import taller.multimedia.backend.model.gallery.GalleryImage;
import taller.multimedia.backend.repository.gallery.GalleryImageRepository;
import taller.multimedia.backend.repository.gallery.GalleryRepository;
import taller.multimedia.backend.repository.gallery.ImageLikeCountProjection;
import taller.multimedia.backend.repository.gallery.ImageLikeRepository;
import taller.multimedia.backend.service.storage.StorageService;
import taller.multimedia.backend.util.Sanitizer;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Images of the photo galleries, stored in the gallery bucket, with their like counts.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GalleryImageService {

    private final GalleryImageRepository imageRepository;
    private final GalleryRepository galleryRepository;
    private final ImageLikeRepository imageLikeRepository;
    private final StorageService storageService;

    @Value("${supabase.s3.buckets.gallery}")
    private String galleryBucket;

    private static final String FOLDER = "images_content";

    /**
     * Uploads several images to a gallery, all with the same title.
     *
     * @param galleryId gallery ID
     * @param files images in PNG, JPG, JPEG, WEBP or SVG format
     * @param title title shown for the images; it is sanitized
     * @param altTexts alternative texts in the same order as the files; missing ones are left empty
     * @return the saved images, with zero likes
     * @throws RuntimeException if the gallery does not exist
     * @throws IllegalArgumentException if there are no files, the title is missing or a format is
     *     not allowed
     * @throws taller.multimedia.backend.exception.InvalidFieldException if the title is unsafe
     */
    @Transactional
    public List<GalleryImageResponse> uploadImages(UUID galleryId, List<MultipartFile> files, String title, List<String> altTexts) {
        Gallery gallery = galleryRepository.findById(galleryId)
                .orElseThrow(() -> new RuntimeException("Gallery not found with ID: " + galleryId));

        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("You must select at least one file.");
        }

        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("The image title is required.");
        }

        String cleanTitle = Sanitizer.requireClean("title", title);

        List<GalleryImageResponse> responses = new ArrayList<>();

        for (int index = 0; index < files.size(); index++) {
            MultipartFile file = files.get(index);
            String contentType = file.getContentType();
            if (contentType == null || !isValidImageFormat(contentType)) {
                throw new IllegalArgumentException(
                        "One of the files has an unsupported format. Only PNG, JPG, JPEG, WEBP and SVG are allowed.");
            }

            long uploadStart = System.currentTimeMillis();
            String fileUrl = storageService.uploadFile(file, galleryBucket, FOLDER);
            log.info("Uploading the gallery image took {} ms", System.currentTimeMillis() - uploadStart);

            GalleryImage image = new GalleryImage();
            image.setGallery(gallery);
            image.setTitle(cleanTitle);
            image.setFileUrl(fileUrl);
            image.setAltText(ImageAltText.at(altTexts, index));

            GalleryImage saved = imageRepository.save(image);
            responses.add(mapToResponse(saved, 0L));
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
        GalleryImage image = imageRepository.findById(imageId)
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
     * @param limit maximum number of images
     * @return the images with the most likes, most liked first
     */
    @Transactional(readOnly = true)
    public List<GalleryImageResponse> getMostLiked(int limit) {
        return imageRepository.findMostLiked(PageRequest.of(0, limit)).stream()
                .map(result -> mapToResponse(result.getImage(), result.getLikes()))
                .toList();
    }

    /**
     * @param galleryId gallery ID
     * @param pageable page to return
     * @return the gallery's images, newest first, with their like counts (loaded in a single query)
     */
    @Transactional(readOnly = true)
    public Page<GalleryImageResponse> getImagesByGallery(UUID galleryId, Pageable pageable) {
        Page<GalleryImage> imagesPage = imageRepository.findByGalleryIdOrderByCreatedAtDesc(galleryId, pageable);

        List<UUID> imageIds = imagesPage.getContent().stream()
                .map(GalleryImage::getId)
                .toList();

        Map<UUID, Long> likeCounts = imageLikeRepository.countByGalleryImagesIdIn(imageIds).stream()
                .collect(Collectors.toMap(
                        ImageLikeCountProjection::getImageId,
                        ImageLikeCountProjection::getTotal));

        return imagesPage.map(image -> mapToResponse(image, likeCounts.getOrDefault(image.getId(), 0L)));
    }

    /**
     * Loads the newest images of several galleries at once, to avoid one query per gallery.
     *
     * @param galleryIds galleries to load
     * @param limitPerGallery maximum images per gallery
     * @return images by gallery ID; galleries without images are not in the map
     */
    @Transactional(readOnly = true)
    public Map<UUID, List<GalleryImageResponse>> getImagesByGalleries(Collection<UUID> galleryIds, int limitPerGallery) {
        if (galleryIds.isEmpty()) return Map.of();
        List<GalleryImage> images = imageRepository.findByGalleryIdInOrderByCreatedAtDesc(galleryIds);
        List<UUID> imageIds = images.stream().map(GalleryImage::getId).toList();
        Map<UUID, Long> likeCounts = imageIds.isEmpty() ? Map.of() : imageLikeRepository.countByGalleryImagesIdIn(imageIds).stream()
                .collect(Collectors.toMap(ImageLikeCountProjection::getImageId, ImageLikeCountProjection::getTotal));

        Map<UUID, List<GalleryImageResponse>> byGallery = new HashMap<>();
        for (GalleryImage image : images) {
            List<GalleryImageResponse> galleryImages = byGallery.computeIfAbsent(image.getGallery().getId(), id -> new ArrayList<>());
            if (galleryImages.size() < limitPerGallery) galleryImages.add(mapToResponse(image, likeCounts.getOrDefault(image.getId(), 0L)));
        }
        return byGallery;
    }

    /**
     * Deletes an image from storage and from the gallery.
     *
     * @param imageId image ID
     * @throws RuntimeException if the image does not exist or the file cannot be deleted
     */
    @Transactional
    public void deleteImage(UUID imageId) {
        GalleryImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found with ID: " + imageId));

        String filePath = extractPathFromUrl(image.getFileUrl(), galleryBucket);

        if (filePath != null && !filePath.isEmpty()) {
            long deleteStart = System.currentTimeMillis();
            storageService.deleteFile(galleryBucket, filePath);
            log.info("Deleting the gallery image took {} ms", System.currentTimeMillis() - deleteStart);
        }

        imageRepository.delete(image);
    }
    
    /**
     * Deletes from storage the files of all the images of a gallery. A file that cannot be deleted
     * is logged and skipped.
     *
     * @param galleryId gallery ID
     */
    @Transactional
    public void deleteAllImagesByGallery(UUID galleryId) {
        List<GalleryImage> images = imageRepository.findByGalleryId(galleryId);

        for (GalleryImage image : images) {
            String filePath = extractPathFromUrl(image.getFileUrl(), galleryBucket);
            if (filePath != null && !filePath.isEmpty()) {
                try {
                    long deleteStart = System.currentTimeMillis();
                    storageService.deleteFile(galleryBucket, filePath);
                    log.info("Deleting the gallery image took {} ms", System.currentTimeMillis() - deleteStart);
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

/**
 * @param images gallery images
 * @return the storage paths of their files, to delete them later
 */
public List<String> getFilePaths(List<GalleryImage> images) {
    return images.stream()
            .map(image -> extractPathFromUrl(image.getFileUrl(), galleryBucket))
            .filter(path -> path != null && !path.isEmpty())
            .collect(Collectors.toList());
}

/**
 * Deletes files from the gallery bucket. A file that cannot be deleted is logged and skipped.
 *
 * @param filePaths paths returned by {@link #getFilePaths(List)}
 */
public void deleteFiles(List<String> filePaths) {
    for (String path : filePaths) {
        try {
            storageService.deleteFile(galleryBucket, path);
        } catch (Exception e) {
            log.warn("Could not delete file {}: {}", path, e.getMessage());
        }
    }
}

    private GalleryImageResponse mapToResponse(GalleryImage image, long likeCount) {
        return GalleryImageResponse.builder()
                .id(image.getId())
                .galleryId(image.getGallery().getId())
                .title(image.getTitle())
                .fileUrl(image.getFileUrl())
                .altText(image.getAltText())
                .likeCount((int) likeCount)
                .build();
    }
}