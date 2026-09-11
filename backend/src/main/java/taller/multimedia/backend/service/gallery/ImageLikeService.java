package taller.multimedia.backend.service.gallery;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import taller.multimedia.backend.dto.gallery.ImageLikeResponse;
import taller.multimedia.backend.model.gallery.GalleryImages;
import taller.multimedia.backend.model.gallery.ImageLike;
import taller.multimedia.backend.repository.gallery.ImageLikeRepository;
import taller.multimedia.backend.repository.gallery.GalleryImageRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

import lombok.RequiredArgsConstructor;

import java.util.UUID;


@Service
@RequiredArgsConstructor
public class ImageLikeService {

    private final ImageLikeRepository imageLikeRepository;
    private final GalleryImageRepository galleryImageRepository;

    public ImageLikeResponse likeImage(UUID galleryImagesId, String anonId) {
    if (imageLikeRepository.existsByGalleryImagesIdAndAnonId(galleryImagesId, anonId)) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya diste like a esta foto");
    }
    
        GalleryImages image = galleryImageRepository.findById(galleryImagesId)
            .orElseThrow(() -> new EntityNotFoundException("Imagen no encontrada"));

        ImageLike like = new ImageLike();
        like.setGalleryImages(image);
        like.setAnonId(anonId);
        imageLikeRepository.save(like);


        long total = imageLikeRepository.countByGalleryImagesId(galleryImagesId);
        return new ImageLikeResponse(galleryImagesId, (int) total);
    }
}
