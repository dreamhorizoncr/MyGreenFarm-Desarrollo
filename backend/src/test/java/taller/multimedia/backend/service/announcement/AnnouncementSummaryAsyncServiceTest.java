package taller.multimedia.backend.service.announcement;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.model.announcement.Announcement;
import taller.multimedia.backend.model.announcement.AnnouncementType;
import taller.multimedia.backend.repository.announcement.AnnouncementRepository;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnnouncementSummaryAsyncServiceTest {

    @Mock
    private AnnouncementRepository announcementRepository;

    @Mock
    private GeminiResumenService geminiResumenService;

    @InjectMocks
    private AnnouncementSummaryAsyncService announcementSummaryAsyncService;

    @Test
    void noLlamaALaApiSiElContenidoNoCambio() {
        UUID id = UUID.randomUUID();
        Announcement announcement = new Announcement("Título", "Contenido sin cambios", AnnouncementType.NEWS);
        announcement.setId(id);
        announcement.setAiSummaryContentHash(AnnouncementSummaryAsyncService.sha256("Contenido sin cambios"));

        when(announcementRepository.findById(id)).thenReturn(Optional.of(announcement));

        announcementSummaryAsyncService.generateSummaryAsync(id, false);

        verify(geminiResumenService, never()).generarResumen(any());
        verify(announcementRepository, never()).save(any());
    }

    @Test
    void generaYGuardaElResumenSiElContenidoCambio() {
        UUID id = UUID.randomUUID();
        Announcement announcement = new Announcement("Título", "Contenido nuevo", AnnouncementType.NEWS);
        announcement.setId(id);
        announcement.setAiSummaryContentHash(AnnouncementSummaryAsyncService.sha256("Contenido viejo"));

        when(announcementRepository.findById(id)).thenReturn(Optional.of(announcement));
        when(geminiResumenService.generarResumen("Contenido nuevo")).thenReturn("Resumen generado.");

        announcementSummaryAsyncService.generateSummaryAsync(id, false);

        verify(geminiResumenService, times(1)).generarResumen(eq("Contenido nuevo"));
        verify(announcementRepository, times(1)).save(announcement);
    }

    @Test
    void fuerzaLaRegeneracionAunqueElContenidoNoHayaCambiado() {
        UUID id = UUID.randomUUID();
        Announcement announcement = new Announcement("Título", "Contenido sin cambios", AnnouncementType.NEWS);
        announcement.setId(id);
        announcement.setAiSummaryContentHash(AnnouncementSummaryAsyncService.sha256("Contenido sin cambios"));

        when(announcementRepository.findById(id)).thenReturn(Optional.of(announcement));
        when(geminiResumenService.generarResumen("Contenido sin cambios")).thenReturn("Resumen regenerado.");

        announcementSummaryAsyncService.generateSummaryAsync(id, true);

        verify(geminiResumenService, times(1)).generarResumen(eq("Contenido sin cambios"));
        verify(announcementRepository, times(1)).save(announcement);
    }
}
