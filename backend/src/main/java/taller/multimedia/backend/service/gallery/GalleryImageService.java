package taller.multimedia.backend.service.gallery;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import taller.multimedia.backend.dto.gallery.GalleryImageResponse;
import taller.multimedia.backend.model.gallery.Gallery;
import taller.multimedia.backend.model.gallery.GalleryImages;
import taller.multimedia.backend.repository.gallery.GalleryImageRepository;
import taller.multimedia.backend.repository.gallery.GalleryRepository;
import taller.multimedia.backend.service.StorageService;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GalleryImageService {

    private final GalleryImageRepository imageRepository;
    private final GalleryRepository galleryRepository;
    private final StorageService storageService;

    @Value("${supabase.s3.buckets.gallery}")
    private String galleryBucket;

    private static final String FOLDER = "images_content";

    @Transactional
    public List<GalleryImageResponse> uploadImages(UUID galleryId, List<MultipartFile> files, String title) {
        Gallery gallery = galleryRepository.findById(galleryId)
                .orElseThrow(() -> new RuntimeException("Galería no encontrada con ID: " + galleryId));

        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Debe seleccionar al menos un archivo.");
        }

        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("El título de la imagen es obligatorio.");
        }

        List<GalleryImageResponse> responses = new ArrayList<>();

        for (MultipartFile file : files) {
            String contentType = file.getContentType();
            if (contentType == null || !isValidImageFormat(contentType)) {
                throw new IllegalArgumentException("Formato no permitido en uno de los archivos. Solo PNG, JPG, JPEG, SVG.");
            }

            String fileUrl = storageService.uploadFile(file, galleryBucket, FOLDER);

            GalleryImages image = new GalleryImages();
            image.setGallery(gallery);
            image.setTitle(title);
            image.setFileUrl(fileUrl);

            GalleryImages saved = imageRepository.save(image);
            responses.add(mapToResponse(saved));
        }

        return responses;
    }

    private boolean isValidImageFormat(String contentType) {
        return contentType.equals("image/png") ||
                contentType.equals("image/jpg") ||
                contentType.equals("image/jpeg") ||
                contentType.equals("image/svg+xml");
    }

    @Transactional(readOnly = true)
    public List<GalleryImageResponse> getImagesByGallery(UUID galleryId) {
        return imageRepository.findByGalleryId(galleryId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteImage(UUID imageId) {
        GalleryImages image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Imagen no encontrada con ID: " + imageId));

        String filePath = extractPathFromUrl(image.getFileUrl(), galleryBucket);

        if (filePath != null && !filePath.isEmpty()) {
            storageService.deleteFile(galleryBucket, filePath);
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
                    storageService.deleteFile(galleryBucket, filePath);
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

    private GalleryImageResponse mapToResponse(GalleryImages image) {
        return GalleryImageResponse.builder()
                .id(image.getId())
                .galleryId(image.getGallery().getId())
                .title(image.getTitle())
                .fileUrl(image.getFileUrl())
                .build();
    }
}