package taller.multimedia.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import taller.multimedia.backend.dto.AnnouncementRequest;
import taller.multimedia.backend.dto.AnnouncementResponse;
import taller.multimedia.backend.service.AnnouncementService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<AnnouncementResponse> create(@RequestBody @Valid AnnouncementRequest dto) {
        AnnouncementResponse created = announcementService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<AnnouncementResponse>> getAll(
            @RequestParam(name = "lang", defaultValue = "es") String lang) {
        List<AnnouncementResponse> announcements = announcementService.getAll(lang);
        return ResponseEntity.ok(announcements);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<AnnouncementResponse> update(
            @PathVariable UUID id, 
            @RequestBody @Valid AnnouncementRequest dto) {
        AnnouncementResponse updated = announcementService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        announcementService.delete(id);
        return ResponseEntity.noContent().build(); // Retorna un código 204 No Content indicando éxito
    }
}