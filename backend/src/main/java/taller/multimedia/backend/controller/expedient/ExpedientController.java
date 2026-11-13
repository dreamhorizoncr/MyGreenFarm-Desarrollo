package taller.multimedia.backend.controller.expedient;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.expedient.ExpedientRequest;
import taller.multimedia.backend.dto.expedient.ExpedientResponse;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.service.expedient.ExpedientService;
import taller.multimedia.backend.service.group.TeacherScopeService;
import tools.jackson.databind.ObjectMapper;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.http.MediaType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.util.UUID;

@RestController
@RequestMapping("/api/expedients")
@RequiredArgsConstructor
public class ExpedientController {

    private final ExpedientService expedientService;

    private final ObjectMapper objectMapper;

    private final TeacherScopeService teacherScope;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<ExpedientResponse> createExpedient(
            @RequestParam("data") String requestJson,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication authentication) {

        try {
            ExpedientRequest request = objectMapper.readValue(requestJson, ExpedientRequest.class);
            requireStudent(authentication, request.getStudentId());

            ExpedientResponse created = expedientService.createExpedient(request, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (InvalidFieldException | ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error processing the record: " + e.getMessage());
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Page<ExpedientResponse>> getAllExpedients(
        @PageableDefault(size = 10, sort = "child.firstName") Pageable pageable,
        Authentication authentication) {
        Page<ExpedientResponse> expedients = teacherScope.visibleChildIds(authentication)
                .map(childIds -> expedientService.getExpedientsForChildren(childIds, pageable))
                .orElseGet(() -> expedientService.getAllExpedients(pageable));
        return ResponseEntity.ok(expedients);
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<ExpedientResponse> getExpedientByStudentId(@PathVariable String studentId,
            Authentication authentication) {
        Long childId = expedientService.findChildIdByStudentId(studentId.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Child not found"));
        teacherScope.requireChild(authentication, childId);
        return ResponseEntity.ok(expedientService.getExpedientByStudentId(studentId.trim()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<ExpedientResponse> getExpedientById(@PathVariable UUID id, Authentication authentication) {
        teacherScope.requireChild(authentication, expedientService.getChildId(id));
        ExpedientResponse expedient = expedientService.getExpedientById(id);
        return ResponseEntity.ok(expedient);
    }

    @DeleteMapping("/{id}/photo")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Void> deletePhoto(@PathVariable UUID id, Authentication authentication) {
        teacherScope.requireChild(authentication, expedientService.getChildId(id));
        expedientService.deletePhoto(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Void> deleteExpedient(@PathVariable UUID id, Authentication authentication) {
        teacherScope.requireChild(authentication, expedientService.getChildId(id));
        expedientService.deleteExpedient(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<ExpedientResponse> uploadOrUpdatePhoto(
            @PathVariable UUID id,
            @RequestParam("data") String requestJson,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication authentication) {

        teacherScope.requireChild(authentication, expedientService.getChildId(id));
        try {
            ExpedientRequest request = objectMapper.readValue(requestJson, ExpedientRequest.class);
            requireStudent(authentication, request.getStudentId());
            ExpedientResponse updated = expedientService.uploadOrUpdatePhoto(id, request, file);
            return ResponseEntity.ok(updated);
        } catch (InvalidFieldException | ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error updating the record: " + e.getMessage());
        }
    }

    private void requireStudent(Authentication authentication, String studentId) {
        if (studentId == null || studentId.isBlank()) {
            return;
        }
        expedientService.findChildIdByStudentId(studentId.trim())
                .ifPresent(childId -> teacherScope.requireChild(authentication, childId));
    }
}
