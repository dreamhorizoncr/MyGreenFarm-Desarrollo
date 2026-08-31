package taller.multimedia.backend.service.announcement;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import taller.multimedia.backend.dto.announcement.AnnouncementRequest;
import taller.multimedia.backend.dto.announcement.AnnouncementResponse;
import taller.multimedia.backend.model.announcement.Announcement;
import taller.multimedia.backend.repository.AnnouncementRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementImageService announcementImageService;
    private final AnnouncementRepository announcementRepository;

    @Transactional
    public AnnouncementResponse create(AnnouncementRequest dto) {

        Announcement announcement = new Announcement();
        announcement.setTitle(dto.getTitle());
        announcement.setContent(dto.getContent());
        announcement.setType(dto.getType());
        announcement.setEventDate(dto.getEventDate());
        announcement.setLocation(dto.getLocation());

        Announcement saved = announcementRepository.save(announcement);
        return mapToResponse(saved, "es"); // Por defecto se guarda/crea en español
    }

    // Este método recibe la inicial del idioma, ejemplo "en" y devuelve todos los anuncios en ese idioma
    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAll(String lang) {
        return announcementRepository.findAll().stream()
                .map(announcement -> mapToResponse(announcement, lang))
                .collect(Collectors.toList());
    }

    // Método auxiliar para transformar la entidad al DTO de respuesta y aplicar traducción si es necesario
    private AnnouncementResponse mapToResponse(Announcement announcement, String lang) {
        AnnouncementResponse response = new AnnouncementResponse();
        response.setId(announcement.getId());
        response.setType(announcement.getType());
        response.setEventDate(announcement.getEventDate());
        response.setLocation(announcement.getLocation());

        // Aquí es donde se inyecta la lógica: si 'lang' es 'en' o 'fr', 
        // busca el texto traducido en la tabla de traducciones, si es 'es', usa el original
        if ("en".equals(lang) || "fr".equals(lang)) {
            response.setTitle(announcement.getTitle()); // Placeholder temporal
            response.setContent(announcement.getContent()); // Placeholder temporal
        } else {
            response.setTitle(announcement.getTitle());
            response.setContent(announcement.getContent());
        }

        return response;
    }

    @Transactional
    public AnnouncementResponse update(UUID id, AnnouncementRequest dto) {
        // 1. Busca si el anuncio existe; si no, lanza un error
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anuncio no encontrado con ID: " + id));

        // 2. Actualiza los campos con los nuevos datos
        announcement.setTitle(dto.getTitle());
        announcement.setContent(dto.getContent());
        announcement.setType(dto.getType());
        announcement.setEventDate(dto.getEventDate());
        announcement.setLocation(dto.getLocation());

        // 3. Guarda los cambios en la base de datos
        Announcement updated = announcementRepository.save(announcement);
        return mapToResponse(updated, "es");
    }

    @Transactional
    public void delete(UUID id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anuncio no encontrado con ID: " + id));

        // 1. Borrar primero los archivos físicos del bucket usando el servicio de imágenes
        announcementImageService.deleteAllImagesByAnnouncement(id);

        // 2. Borrar el anuncio (y por cascada se limpian los registros de la BD)
        announcementRepository.delete(announcement);
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAllActive(String lang) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(28);
        
        return announcementRepository.findByCreatedAtAfter(thirtyDaysAgo).stream()
                .map(announcement -> mapToResponse(announcement, lang))
                .collect(Collectors.toList());
    }
}