package taller.multimedia.backend.service.gallery;

import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;

import taller.multimedia.backend.dto.gallery.ImageLikeResponse;
import taller.multimedia.backend.model.gallery.GalleryImage;
import taller.multimedia.backend.model.gallery.ImageLike;
import taller.multimedia.backend.repository.gallery.ImageLikeRepository;
import taller.multimedia.backend.repository.gallery.GalleryImageRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;


/**
 * Likes on gallery images from anonymous visitors, identified by an anonymous ID stored in their
 * browser.
 */
@Service
@RequiredArgsConstructor
public class ImageLikeService {

    private final ImageLikeRepository imageLikeRepository;
    private final GalleryImageRepository galleryImageRepository;

/**
 * Adds the visitor's like to an image, or removes it if they had already liked it.
 *
 * <p>If two requests from the same visitor race and the unique constraint rejects the second insert,
 * the image is reported as liked.
 *
 * @param imageId gallery image
 * @param anonId anonymous visitor ID
 * @return whether the image is now liked by the visitor and its total likes
 * @throws EntityNotFoundException if the image does not exist
 */
@Transactional
public ImageLikeResponse toggleLike(UUID imageId, String anonId) {
    boolean alreadyLiked = imageLikeRepository.existsByGalleryImagesIdAndAnonId(imageId, anonId);

    boolean liked;
    if (alreadyLiked) {
        imageLikeRepository.deleteByGalleryImagesIdAndAnonId(imageId, anonId);
        liked = false;
    } else {
        try {
            GalleryImage image = galleryImageRepository.findById(imageId)
                    .orElseThrow(() -> new EntityNotFoundException("Image not found"));

            ImageLike like = new ImageLike();
            like.setGalleryImages(image);
            like.setAnonId(anonId);
            imageLikeRepository.save(like);
            liked = true;
        } catch (DataIntegrityViolationException e) {
            liked = true;
        }
    }

    int total = (int) imageLikeRepository.countByGalleryImagesId(imageId);
    return new ImageLikeResponse(imageId, total, liked);
}

/**
 * @param anonId anonymous visitor ID
 * @return IDs of the images the visitor has liked
 */
public List<UUID> findLikedImageIds(String anonId) {
    return imageLikeRepository.findByAnonId(anonId).stream()
            .map(like -> like.getGalleryImages().getId())
            .toList();
}
}
