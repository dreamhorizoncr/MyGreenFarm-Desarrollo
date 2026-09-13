package taller.multimedia.backend.controller.expedient;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.expedient.ExpedientRequest;
import taller.multimedia.backend.dto.expedient.ExpedientResponse;
import taller.multimedia.backend.model.expedient.Expedient;
import taller.multimedia.backend.service.expedient.ExpedientService;
import tools.jackson.databind.ObjectMapper;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.http.MediaType;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/expedients")
@RequiredArgsConstructor
public class ExpedientController {

    private final ExpedientService expedientService;

    private final ObjectMapper objectMapper;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ExpedientResponse> createExpedient(
            @RequestParam("data") String requestJson,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        
        try {
            // Convierte el texto JSON en tu DTO con validaciones
            ExpedientRequest request = objectMapper.readValue(requestJson, ExpedientRequest.class);
            
            ExpedientResponse created = expedientService.createExpedient(request, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            throw new RuntimeException("Error al procesar el expediente: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<ExpedientResponse>> getAllExpedients() {
        List<ExpedientResponse> expedients = expedientService.getAllExpedients();
        return ResponseEntity.ok(expedients);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpedientResponse> getExpedientById(@PathVariable UUID id) {
        ExpedientResponse expedient = expedientService.getExpedientById(id);
        return ResponseEntity.ok(expedient);
    }

    @DeleteMapping("/{id}/photo")
    public ResponseEntity<Void> deletePhoto(@PathVariable UUID id) {
        expedientService.deletePhoto(id);
        return ResponseEntity.noContent().build();
    }

    // Modifica o añade la foto del niño
    @PostMapping("/{id}/updated")
    public ResponseEntity<ExpedientResponse> uploadOrUpdatePhoto(
            @PathVariable UUID id, 
            @RequestParam("file") MultipartFile file) {
        ExpedientResponse updated = expedientService.uploadOrUpdatePhoto(id, file);
        return ResponseEntity.ok(updated);
    }
}
