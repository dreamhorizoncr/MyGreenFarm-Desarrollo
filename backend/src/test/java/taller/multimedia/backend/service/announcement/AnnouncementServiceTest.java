package taller.multimedia.backend.service.announcement;

import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.announcement.AnnouncementRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.announcement.AnnouncementType;
import taller.multimedia.backend.repository.announcement.AnnouncementRepository;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AnnouncementServiceTest {

    @Mock
    private AnnouncementImageService announcementImageService;

    @Mock
    private AnnouncementRepository announcementRepository;

    @InjectMocks
    private AnnouncementService announcementService;

    private AnnouncementRequest requestWith(String title, String content, String location) {
        AnnouncementRequest request = new AnnouncementRequest();
        request.setTitle(title);
        request.setContent(content);
        request.setType(AnnouncementType.NEWS);
        request.setLocation(location);
        return request;
    }

    @ParameterizedTest
    @ValueSource(strings = { "title", "content", "location" })
    void create_rejectsMaliciousFieldsAndNeverSaves(String field) {
        String maliciousValue = "<script>alert(1)</script>x";
        AnnouncementRequest request = requestWith("Título válido", "Contenido válido y suficientemente largo", "Salón principal");

        switch (field) {
            case "title" -> request.setTitle(maliciousValue);
            case "content" -> request.setContent(maliciousValue);
            case "location" -> request.setLocation(maliciousValue);
            default -> throw new IllegalStateException("Campo no cubierto: " + field);
        }

        assertThrows(InvalidFieldException.class, () -> announcementService.create(request));

        verify(announcementRepository, never()).save(any());
    }
}
