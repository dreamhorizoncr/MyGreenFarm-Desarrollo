package taller.multimedia.backend.service.gallery;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

import taller.multimedia.backend.dto.gallery.ImageLikeResponse;
import taller.multimedia.backend.model.gallery.GalleryImages;
import taller.multimedia.backend.model.gallery.ImageLike;
import taller.multimedia.backend.repository.gallery.ImageLikeRepository;
import taller.multimedia.backend.repository.gallery.GalleryImageRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class ImageLikeService {

    private final ImageLikeRepository imageLikeRepository;
    private final GalleryImageRepository galleryImageRepository;

@Transactional
public ImageLikeResponse toggleLike(UUID imageId, String anonId) {
    boolean alreadyLiked = imageLikeRepository.existsByGalleryImagesIdAndAnonId(imageId, anonId);

    boolean liked;
    if (alreadyLiked) {
        imageLikeRepository.deleteByGalleryImagesIdAndAnonId(imageId, anonId);
        liked = false;
    } else {
        try {
            GalleryImages image = galleryImageRepository.findById(imageId)
                    .orElseThrow(() -> new EntityNotFoundException("Imagen no encontrada"));

            ImageLike like = new ImageLike();
            like.setGalleryImages(image);
            like.setAnonId(anonId);
            imageLikeRepository.save(like);
            liked = true;
        } catch (DataIntegrityViolationException e) {
            liked = true; // condición de carrera: ya existía
        }
    }

    int total = (int) imageLikeRepository.countByGalleryImagesId(imageId);
    return new ImageLikeResponse(imageId, total, liked);
}

public List<UUID> findLikedImageIds(String anonId) {
    return imageLikeRepository.findByAnonId(anonId).stream()
            .map(like -> like.getGalleryImages().getId())
            .toList();
}
}
