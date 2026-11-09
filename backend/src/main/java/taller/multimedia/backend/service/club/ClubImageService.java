package taller.multimedia.backend.service.club;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.util.ImageAltText;
import taller.multimedia.backend.dto.club.ClubImageResponse;
import taller.multimedia.backend.model.club.Club;
import taller.multimedia.backend.model.club.ClubImage;
import taller.multimedia.backend.repository.club.ClubImageRepository;
import taller.multimedia.backend.repository.club.ClubRepository;
import taller.multimedia.backend.service.StorageService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.EntityNotFoundException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClubImageService {

    private final ClubImageRepository imageRepository;
    private final ClubRepository clubRepository;
    private final StorageService storageService;

    @Value("${supabase.s3.buckets.clubs}")
    private String clubsBucket;

    @Transactional
    public List<ClubImageResponse> uploadImages(Long clubId, List<MultipartFile> files, boolean isCover, List<String> altTexts) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("Club not found with ID: " + clubId));

        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("You must select at least one file.");
        }

        if (isCover && files.size() > 1) {
            throw new IllegalArgumentException("Only one cover image can be set at a time.");
        }

        List<ClubImage> existingImages = imageRepository.findByClubIdOrderBySortOrderAsc(clubId);
        long currentGalleryCount = existingImages.stream().filter(img -> !Boolean.TRUE.equals(img.getIsCover()))
                .count();

        if (!isCover && (currentGalleryCount + files.size() > 4)) {
            throw new IllegalStateException(
                    "Limit exceeded. A maximum of 4 images is allowed in the gallery. Current count: "
                            + currentGalleryCount);
        }

        if (isCover) {
            Optional<ClubImage> existingCover = imageRepository.findByClubIdAndIsCoverTrue(clubId);
            if (existingCover.isPresent()) {
                String oldPath = extractPathFromUrl(existingCover.get().getFileUrl(), clubsBucket);
                if (oldPath != null) {
                    storageService.deleteFile(clubsBucket, oldPath);
                }
                imageRepository.delete(existingCover.get());
            }
        }

        List<ClubImageResponse> responses = new ArrayList<>();
        String folder = isCover ? "cover_images" : "images_content";

        for (int index = 0; index < files.size(); index++) {
            MultipartFile file = files.get(index);
            String contentType = file.getContentType();
            if (contentType == null || !isValidImageFormat(contentType)) {
                throw new IllegalArgumentException(
                        "One of the files has an unsupported format. Only PNG, JPG, JPEG, SVG, and WEBP are allowed.");
            }

            String fileUrl = storageService.uploadFile(file, clubsBucket, folder);

            ClubImage image = new ClubImage();
            image.setClub(club);
            image.setFileUrl(fileUrl);
            image.setIsCover(isCover);
            image.setAltText(ImageAltText.at(altTexts, index));

            ClubImage saved = imageRepository.save(image);
            responses.add(mapToResponse(saved));
        }

        return responses;
    }

    @Transactional
    public ClubImageResponse updateImage(Long imageId, MultipartFile file, Boolean isCover) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("You must select a valid file to update.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !isValidImageFormat(contentType)) {
            throw new IllegalArgumentException("Unsupported format. Only PNG, JPG, JPEG, SVG and WEBP are allowed.");
        }

        ClubImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new EntityNotFoundException("Image not found with ID: " + imageId));

        Long clubId = image.getClub().getId();
        boolean newIsCover = isCover != null ? isCover : Boolean.TRUE.equals(image.getIsCover());
        boolean wasCover = Boolean.TRUE.equals(image.getIsCover());

        if (!newIsCover) {
            List<ClubImage> existingImages = imageRepository.findByClubIdOrderBySortOrderAsc(clubId);
            long currentGalleryCount = existingImages.stream()
                    .filter(img -> !Boolean.TRUE.equals(img.getIsCover()) && !img.getId().equals(imageId))
                    .count();

            if (currentGalleryCount >= 4) {
                throw new IllegalStateException(
                        "Limit reached. A maximum of 4 images is allowed in the gallery.");
            }
        }

        if (!wasCover && newIsCover) {
            Optional<ClubImage> existingCover = imageRepository.findByClubIdAndIsCoverTrue(clubId);
            if (existingCover.isPresent() && !existingCover.get().getId().equals(imageId)) {
                String oldCoverPath = extractPathFromUrl(existingCover.get().getFileUrl(), clubsBucket);
                if (oldCoverPath != null) {
                    storageService.deleteFile(clubsBucket, oldCoverPath);
                }
                imageRepository.delete(existingCover.get());
            }
        }

        String oldFilePath = extractPathFromUrl(image.getFileUrl(), clubsBucket);
        if (oldFilePath != null && !oldFilePath.isEmpty()) {
            try {
                storageService.deleteFile(clubsBucket, oldFilePath);
            } catch (Exception e) {
                System.err.println("Could not delete the old image from storage: " + e.getMessage());
            }
        }

        String folder = newIsCover ? "cover_images" : "images_content";
        String newFileUrl = storageService.uploadFile(file, clubsBucket, folder);

        image.setFileUrl(newFileUrl);
        image.setIsCover(newIsCover);
        ClubImage updated = imageRepository.save(image);

        return mapToResponse(updated);
    }

    @Transactional
    public ClubImageResponse updateSortOrder(Long imageId, Integer newSortOrder) {
        if (newSortOrder == null || newSortOrder < 0) {
            throw new IllegalArgumentException("The image order must be a whole number greater than or equal to zero.");
        }

        ClubImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new EntityNotFoundException("Image not found with ID: " + imageId));

        image.setSortOrder(newSortOrder);
        ClubImage updated = imageRepository.save(image);

        return mapToResponse(updated);
    }

    @Transactional
    public void updateAltText(Long imageId, String altText) {
        ClubImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found with ID: " + imageId));
        image.setAltText(ImageAltText.clean(altText));
        imageRepository.save(image);
    }

    private boolean isValidImageFormat(String contentType) {
        return contentType.equals("image/png") ||
                contentType.equals("image/jpg") ||
                contentType.equals("image/jpeg") ||
                contentType.equals("image/svg+xml") ||
                contentType.equals("image/webp");
    }

    @Transactional(readOnly = true)
    public List<ClubImageResponse> getImagesByClub(Long clubId) {
        return imageRepository.findByClubIdOrderBySortOrderAsc(clubId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteImage(Long imageId) {
        ClubImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new EntityNotFoundException("Image not found with ID: " + imageId));

        String fileUrl = image.getFileUrl();
        String filePath = extractPathFromUrl(fileUrl, clubsBucket);

        if (filePath != null && !filePath.isEmpty()) {
            try {
                storageService.deleteFile(clubsBucket, filePath);
            } catch (Exception e) {
                System.err.println("Could not delete the file from the bucket: " + e.getMessage());
            }
        }

        Club club = image.getClub();
        if (club != null && club.getImages() != null) {
            club.getImages().remove(image);
            image.setClub(null);
        } else {
            imageRepository.delete(image);
        }
    }

    @Transactional
    public void deleteAllImagesByClub(Long clubId) {
        List<ClubImage> images = imageRepository.findByClubIdOrderBySortOrderAsc(clubId);

        if (images.isEmpty()) {
            return;
        }

        for (ClubImage image : images) {
            String filePath = extractPathFromUrl(image.getFileUrl(), clubsBucket);
            if (filePath != null && !filePath.isEmpty()) {
                try {
                    storageService.deleteFile(clubsBucket, filePath);
                } catch (Exception e) {
                    System.err.println("Could not delete the file from the bucket: " + e.getMessage());
                }
            }
        }

        Club club = images.get(0).getClub();
        if (club != null && club.getImages() != null) {
            club.getImages().removeAll(images);
        }

        imageRepository.deleteAll(images);
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

    private ClubImageResponse mapToResponse(ClubImage image) {
        return ClubImageResponse.builder()
                .id(image.getId())
                .clubId(image.getClub().getId())
                .fileUrl(image.getFileUrl())
                .altText(image.getAltText())
                .isCover(image.getIsCover())
                .sortOrder(image.getSortOrder())
                .build();
    }
}
