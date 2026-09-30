package taller.multimedia.backend.service.gallery;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.gallery.Gallery;
import taller.multimedia.backend.repository.gallery.GalleryImageRepository;
import taller.multimedia.backend.repository.gallery.GalleryRepository;
import taller.multimedia.backend.repository.gallery.ImageLikeRepository;
import taller.multimedia.backend.service.StorageService;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GalleryImageServiceTest {

    @Mock
    private GalleryImageRepository imageRepository;

    @Mock
    private GalleryRepository galleryRepository;

    @Mock
    private ImageLikeRepository imageLikeRepository;

    @Mock
    private StorageService storageService;

    private GalleryImageService galleryImageService;

    @BeforeEach
    void setUp() {
        galleryImageService = new GalleryImageService(imageRepository, galleryRepository, imageLikeRepository, storageService);
        ReflectionTestUtils.setField(galleryImageService, "galleryBucket", "gallery");
    }

    @Test
    void uploadImages_rejectsAMaliciousTitleAndNeverSaves() {
        UUID galleryId = UUID.randomUUID();
        when(galleryRepository.findById(galleryId)).thenReturn(Optional.of(new Gallery()));

        List<org.springframework.web.multipart.MultipartFile> files = List.of(
                new MockMultipartFile("file", "foto.png", "image/png", new byte[] { 1, 2, 3 }));

        assertThrows(InvalidFieldException.class,
                () -> galleryImageService.uploadImages(galleryId, files, "<script>alert(1)</script>Título"));

        verify(imageRepository, never()).save(any());
        verify(storageService, never()).uploadFile(any(), any(), any());
    }
}
