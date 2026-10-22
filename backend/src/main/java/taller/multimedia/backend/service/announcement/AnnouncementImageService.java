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
import taller.multimedia.backend.service.StorageService;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementImageService {

    private final AnnouncementImageRepository imageRepository;
    private final AnnouncementRepository announcementRepository;
    private final StorageService storageService;

    @Value("${supabase.s3.buckets.announcements}")
    private String announcementsBucket;

    @Transactional
    public List<AnnouncementImageResponse> uploadImages(UUID announcementId, List<MultipartFile> files,
            boolean isCover, List<String> altTexts) {
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new RuntimeException("Anuncio no encontrado con ID: " + announcementId));

        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Debe seleccionar al menos un archivo.");
        }

        if (isCover && files.size() > 1) {
            throw new IllegalArgumentException("Solo se puede establecer una imagen de portada a la vez.");
        }

        List<AnnouncementImage> existingImages = imageRepository.findByAnnouncementId(announcementId);
        long currentGalleryCount = existingImages.stream().filter(img -> !img.getIsCover()).count();

        if (!isCover && (currentGalleryCount + files.size() > 4)) {
            throw new IllegalStateException(
                    "Límite excedido. Solo se permiten un máximo de 4 imágenes en la galería. Actualmente hay "
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
                        "Formato no permitido en uno de los archivos. Solo PNG, JPG, JPEG, SVG.");
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

    @Transactional
    public void updateAltText(UUID imageId, String altText) {
        AnnouncementImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Imagen no encontrada con ID: " + imageId));
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
    public List<AnnouncementImageResponse> getImagesByAnnouncement(UUID announcementId) {
        return imageRepository.findByAnnouncementId(announcementId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteImage(UUID imageId) {
        AnnouncementImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Imagen no encontrada con ID: " + imageId));

        String fileUrl = image.getFileUrl();
        String filePath = extractPathFromUrl(fileUrl, announcementsBucket);

        if (filePath != null && !filePath.isEmpty()) {
            storageService.deleteFile(announcementsBucket, filePath);
        }

        imageRepository.delete(image);
    }

    @Transactional
    public void deleteAllImagesByAnnouncement(UUID announcementId) {
        List<AnnouncementImage> images = imageRepository.findByAnnouncementId(announcementId);

        for (AnnouncementImage image : images) {
            String filePath = extractPathFromUrl(image.getFileUrl(), announcementsBucket);
            if (filePath != null && !filePath.isEmpty()) {
                try {
                    storageService.deleteFile(announcementsBucket, filePath);
                } catch (Exception e) {
                    System.err.println("No se pudo borrar el archivo físico del bucket: " + e.getMessage());
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
            System.err.println("Error al extraer la ruta de la URL: " + e.getMessage());
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