package taller.multimedia.backend.service.gallery;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.gallery.GalleryRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.gallery.CategoryGallery;
import taller.multimedia.backend.repository.gallery.CategoryGalleryRepository;
import taller.multimedia.backend.repository.gallery.GalleryRepository;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GalleryServiceTest {

    @Mock
    private GalleryImageService galleryImageService;

    @Mock
    private GalleryRepository galleryRepository;

    @Mock
    private CategoryGalleryRepository categoryGalleryRepository;

    @InjectMocks
    private GalleryService galleryService;

    private GalleryRequest requestWith(String title, String description) {
        CategoryGallery category = new CategoryGallery();
        category.setId(UUID.randomUUID());
        when(categoryGalleryRepository.findById(any())).thenReturn(Optional.of(category));

        GalleryRequest request = new GalleryRequest();
        request.setCategoryId(category.getId());
        request.setTitle(title);
        request.setDescription(description);
        request.setFeatured(false);
        return request;
    }

    @ParameterizedTest
    @ValueSource(strings = { "title", "description" })
    void create_rejectsMaliciousFieldsAndNeverSaves(String field) {
        String maliciousValue = "<script>alert(1)</script>x".repeat(2);
        GalleryRequest request = requestWith("Título válido", "Descripción válida y suficientemente larga");

        switch (field) {
            case "title" -> request.setTitle(maliciousValue);
            case "description" -> request.setDescription(maliciousValue);
            default -> throw new IllegalStateException("Campo no cubierto: " + field);
        }

        assertThrows(InvalidFieldException.class, () -> galleryService.create(request));

        verify(galleryRepository, never()).save(any());
    }
}
