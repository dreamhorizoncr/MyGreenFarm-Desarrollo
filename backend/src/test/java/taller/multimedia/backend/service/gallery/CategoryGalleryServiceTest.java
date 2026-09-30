package taller.multimedia.backend.service.gallery;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.gallery.CategoryGalleryRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.repository.gallery.CategoryGalleryRepository;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CategoryGalleryServiceTest {

    @Mock
    private GalleryService galleryService;

    @Mock
    private CategoryGalleryRepository categoryGalleryRepository;

    @InjectMocks
    private CategoryGalleryService categoryGalleryService;

    @Test
    void create_rejectsAMaliciousTitleAndNeverSaves() {
        CategoryGalleryRequest request = new CategoryGalleryRequest();
        request.setTitle("<script>alert(1)</script>Categoría");

        assertThrows(InvalidFieldException.class, () -> categoryGalleryService.create(request));

        verify(categoryGalleryRepository, never()).save(any());
    }
}
