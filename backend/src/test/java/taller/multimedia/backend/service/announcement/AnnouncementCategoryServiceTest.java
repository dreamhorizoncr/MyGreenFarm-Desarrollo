package taller.multimedia.backend.service.announcement;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.announcement.AnnouncementCategoryRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.announcement.Announcement;
import taller.multimedia.backend.model.announcement.AnnouncementCategory;
import taller.multimedia.backend.repository.announcement.AnnouncementCategoryRepository;
import taller.multimedia.backend.repository.announcement.AnnouncementRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnnouncementCategoryServiceTest {

    @Mock
    private AnnouncementCategoryRepository categoryRepository;

    @Mock
    private AnnouncementRepository announcementRepository;

    @Mock
    private AnnouncementService announcementService;

    @InjectMocks
    private AnnouncementCategoryService categoryService;

    private AnnouncementCategoryRequest requestWith(String title) {
        AnnouncementCategoryRequest request = new AnnouncementCategoryRequest();
        request.setTitle(title);
        return request;
    }

    @Test
    void create_placesTheNewCategoryAfterTheExistingOnes() {
        when(categoryRepository.existsByTitleIgnoreCase("Talleres")).thenReturn(false);
        when(categoryRepository.findMaxPosition()).thenReturn(4);
        when(categoryRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        categoryService.create(requestWith("  Talleres "));

        ArgumentCaptor<AnnouncementCategory> saved = ArgumentCaptor.forClass(AnnouncementCategory.class);
        verify(categoryRepository).save(saved.capture());
        assertThat(saved.getValue().getTitle()).isEqualTo("Talleres");
        assertThat(saved.getValue().getPosition()).isEqualTo(5);
        assertThat(saved.getValue().getCode()).isNull();
    }

    @Test
    void create_rejectsARepeatedTitle() {
        when(categoryRepository.existsByTitleIgnoreCase("Eventos")).thenReturn(true);

        assertThrows(InvalidFieldException.class, () -> categoryService.create(requestWith("Eventos")));

        verify(categoryRepository, never()).save(any());
    }

    @Test
    void delete_removesItsAnnouncementsBeforeTheCategory() {
        UUID categoryId = UUID.randomUUID();
        AnnouncementCategory category = new AnnouncementCategory(categoryId, "Transporte", "TRANSPORT", 4);
        Announcement first = new Announcement("Ruta nueva", "Contenido", category);
        first.setId(UUID.randomUUID());
        Announcement second = new Announcement("Horario de buses", "Contenido", category);
        second.setId(UUID.randomUUID());
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(announcementRepository.findByCategoryId(categoryId)).thenReturn(List.of(first, second));

        categoryService.delete(categoryId);

        InOrder order = inOrder(announcementService, categoryRepository);
        order.verify(announcementService).delete(first.getId());
        order.verify(announcementService).delete(second.getId());
        order.verify(categoryRepository).delete(category);
    }
}
