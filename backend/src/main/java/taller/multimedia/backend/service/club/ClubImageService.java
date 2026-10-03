package taller.multimedia.backend.service.club;

import lombok.RequiredArgsConstructor;
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
    public List<ClubImageResponse> uploadImages(Long clubId, List<MultipartFile> files, boolean isCover) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("Club no encontrado con ID: " + clubId));

        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Debe seleccionar al menos un archivo.");
        }

        if (isCover && files.size() > 1) {
            throw new IllegalArgumentException("Solo se puede establecer una imagen de portada a la vez.");
        }

        List<ClubImage> existingImages = imageRepository.findByClubIdOrderBySortOrderAsc(clubId);
        long currentGalleryCount = existingImages.stream().filter(img -> !Boolean.TRUE.equals(img.getIsCover()))
                .count();

        if (!isCover && (currentGalleryCount + files.size() > 4)) {
            throw new IllegalStateException(
                    "Límite excedido. Solo se permiten un máximo de 4 imágenes en la galería. Actualmente hay "
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

        for (MultipartFile file : files) {
            String contentType = file.getContentType();
            if (contentType == null || !isValidImageFormat(contentType)) {
                throw new IllegalArgumentException(
                        "Formato no permitido en uno de los archivos. Solo PNG, JPG, JPEG, SVG y WEBP.");
            }

            String fileUrl = storageService.uploadFile(file, clubsBucket, folder);

            ClubImage image = new ClubImage();
            image.setClub(club);
            image.setFileUrl(fileUrl);
            image.setIsCover(isCover);

            ClubImage saved = imageRepository.save(image);
            responses.add(mapToResponse(saved));
        }

        return responses;
    }

    @Transactional
    public ClubImageResponse updateImage(Long imageId, MultipartFile file, Boolean isCover) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Debe seleccionar un archivo válido para actualizar.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !isValidImageFormat(contentType)) {
            throw new IllegalArgumentException("Formato no permitido. Solo PNG, JPG, JPEG, SVG y WEBP.");
        }

        ClubImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new EntityNotFoundException("Imagen no encontrada con ID: " + imageId));

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
                        "Límite alcanzado. Solo se permiten un máximo de 4 imágenes en la galería.");
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
                System.err.println("No se pudo eliminar la imagen antigua del storage: " + e.getMessage());
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
            throw new IllegalArgumentException("El orden de la imagen debe ser un número entero mayor o igual a cero.");
        }

        ClubImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new EntityNotFoundException("Imagen no encontrada con ID: " + imageId));

        image.setSortOrder(newSortOrder);
        ClubImage updated = imageRepository.save(image);

        return mapToResponse(updated);
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
                .orElseThrow(() -> new EntityNotFoundException("Imagen no encontrada con ID: " + imageId));

        String fileUrl = image.getFileUrl();
        String filePath = extractPathFromUrl(fileUrl, clubsBucket);

        if (filePath != null && !filePath.isEmpty()) {
            storageService.deleteFile(clubsBucket, filePath);
        }

        imageRepository.delete(image);
    }

    @Transactional
    public void deleteAllImagesByClub(Long clubId) {
        List<ClubImage> images = imageRepository.findByClubIdOrderBySortOrderAsc(clubId);

        for (ClubImage image : images) {
            String filePath = extractPathFromUrl(image.getFileUrl(), clubsBucket);
            if (filePath != null && !filePath.isEmpty()) {
                try {
                    storageService.deleteFile(clubsBucket, filePath);
                } catch (Exception e) {
                    System.err.println("No se pudo borrar el archivo físico del bucket: " + e.getMessage());
                }
            }
        }
        imageRepository.deleteAll(images);
    }

    // Método auxiliar para limpiar la URL y obtener la ruta interna del bucket
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

    private ClubImageResponse mapToResponse(ClubImage image) {
        return ClubImageResponse.builder()
                .id(image.getId())
                .clubId(image.getClub().getId())
                .fileUrl(image.getFileUrl())
                .isCover(image.getIsCover())
                .sortOrder(image.getSortOrder())
                .build();
    }
}
