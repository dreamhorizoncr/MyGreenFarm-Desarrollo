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
import taller.multimedia.backend.model.gallery.GalleryImages;
import taller.multimedia.backend.repository.gallery.GalleryImageRepository;
import taller.multimedia.backend.repository.gallery.GalleryRepository;
import taller.multimedia.backend.repository.gallery.ImageLikeCountProjection;
import taller.multimedia.backend.repository.gallery.ImageLikeRepository;
import taller.multimedia.backend.service.StorageService;
import taller.multimedia.backend.util.Sanitizer;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

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
                        "One of the files has an unsupported format. Only PNG, JPG, JPEG and SVG are allowed.");
            }

            long uploadStart = System.currentTimeMillis();
            String fileUrl = storageService.uploadFile(file, galleryBucket, FOLDER);
            log.info("Uploading the gallery image took {} ms", System.currentTimeMillis() - uploadStart);

            GalleryImages image = new GalleryImages();
            image.setGallery(gallery);
            image.setTitle(cleanTitle);
            image.setFileUrl(fileUrl);
            image.setAltText(ImageAltText.at(altTexts, index));

            GalleryImages saved = imageRepository.save(image);
            responses.add(mapToResponse(saved, 0L));
        }

        return responses;
    }

    @Transactional
    public void updateAltText(UUID imageId, String altText) {
        GalleryImages image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found with ID: " + imageId));
        image.setAltText(ImageAltText.clean(altText));
        imageRepository.save(image);
    }

    private boolean isValidImageFormat(String contentType) {
        return contentType.equals("image/png") ||
                contentType.equals("image/jpg") ||
                contentType.equals("image/jpeg") ||
                contentType.equals("image/svg+xml");
    }

    @Transactional(readOnly = true)
    public List<GalleryImageResponse> getMostLiked(int limit) {
        return imageRepository.findMostLiked(PageRequest.of(0, limit)).stream()
                .map(result -> mapToResponse(result.getImage(), result.getLikes()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<GalleryImageResponse> getImagesByGallery(UUID galleryId, Pageable pageable) {
        Page<GalleryImages> imagesPage = imageRepository.findByGalleryIdOrderByCreatedAtDesc(galleryId, pageable);

        List<UUID> imageIds = imagesPage.getContent().stream()
                .map(GalleryImages::getId)
                .toList();

        Map<UUID, Long> likeCounts = imageLikeRepository.countByGalleryImagesIdIn(imageIds).stream()
                .collect(Collectors.toMap(
                        ImageLikeCountProjection::getImageId,
                        ImageLikeCountProjection::getTotal));

        return imagesPage.map(image -> mapToResponse(image, likeCounts.getOrDefault(image.getId(), 0L)));
    }

    /** Latest images of several galleries with two queries in total, grouped by gallery. */
    @Transactional(readOnly = true)
    public Map<UUID, List<GalleryImageResponse>> getImagesByGalleries(Collection<UUID> galleryIds, int limitPerGallery) {
        if (galleryIds.isEmpty()) return Map.of();
        List<GalleryImages> images = imageRepository.findByGalleryIdInOrderByCreatedAtDesc(galleryIds);
        List<UUID> imageIds = images.stream().map(GalleryImages::getId).toList();
        Map<UUID, Long> likeCounts = imageIds.isEmpty() ? Map.of() : imageLikeRepository.countByGalleryImagesIdIn(imageIds).stream()
                .collect(Collectors.toMap(ImageLikeCountProjection::getImageId, ImageLikeCountProjection::getTotal));

        Map<UUID, List<GalleryImageResponse>> byGallery = new HashMap<>();
        for (GalleryImages image : images) {
            List<GalleryImageResponse> list = byGallery.computeIfAbsent(image.getGallery().getId(), id -> new ArrayList<>());
            if (list.size() < limitPerGallery) list.add(mapToResponse(image, likeCounts.getOrDefault(image.getId(), 0L)));
        }
        return byGallery;
    }

    @Transactional
    public void deleteImage(UUID imageId) {
        GalleryImages image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found with ID: " + imageId));

        String filePath = extractPathFromUrl(image.getFileUrl(), galleryBucket);

        if (filePath != null && !filePath.isEmpty()) {
            long deleteStart = System.currentTimeMillis();
            storageService.deleteFile(galleryBucket, filePath);
            log.info("Deleting the gallery image took {} ms", System.currentTimeMillis() - deleteStart);
        }

        imageRepository.delete(image);
    }
    

    @Transactional
    public void deleteAllImagesByGallery(UUID galleryId) {
        List<GalleryImages> images = imageRepository.findByGalleryId(galleryId);

        for (GalleryImages image : images) {
            String filePath = extractPathFromUrl(image.getFileUrl(), galleryBucket);
            if (filePath != null && !filePath.isEmpty()) {
                try {
                    long deleteStart = System.currentTimeMillis();
                    storageService.deleteFile(galleryBucket, filePath);
                    log.info("Deleting the gallery image took {} ms", System.currentTimeMillis() - deleteStart);
                } catch (Exception e) {
                    System.err.println("Could not delete the file from the bucket: " + e.getMessage());
                }
            }
        }
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

public List<String> getFilePaths(List<GalleryImages> images) {
    return images.stream()
            .map(img -> extractPathFromUrl(img.getFileUrl(), galleryBucket))
            .filter(path -> path != null && !path.isEmpty())
            .collect(Collectors.toList());
}

public void deleteFiles(List<String> filePaths) {
    for (String path : filePaths) {
        try {
            storageService.deleteFile(galleryBucket, path);
        } catch (Exception e) {
            log.warn("Could not delete file {}: {}", path, e.getMessage());
        }
    }
}

    private GalleryImageResponse mapToResponse(GalleryImages image, long likeCount) {
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