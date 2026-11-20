package taller.multimedia.backend.controller.expedient;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.expedient.ExpedientRequest;
import taller.multimedia.backend.dto.expedient.ExpedientResponse;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.service.expedient.ExpedientService;
import taller.multimedia.backend.service.group.TeacherScopeService;
import tools.jackson.core.JacksonException;
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

/**
 * Student records. Teachers may only see and change the records of the children in their groups.
 */
@RestController
@RequestMapping("/api/expedients")
@RequiredArgsConstructor
public class ExpedientController {

    private final ExpedientService expedientService;

    private final ObjectMapper objectMapper;

    private final TeacherScopeService teacherScope;

    /**
     * {@code POST /api/expedients}, multipart.
     *
     * @param requestJson record data as JSON
     * @param file child's photo, optional
     * @param authentication current user
     * @return 201 with the created record
     * @throws InvalidFieldException if a field is invalid
     * @throws ResponseStatusException with 403 if a teacher creates a record for a child outside
     *     their groups
     * @throws RuntimeException if the data cannot be read or the record cannot be saved
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<ExpedientResponse> createExpedient(
            @RequestParam("data") String requestJson,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication authentication) {

        ExpedientRequest request = readRequest(requestJson);
        requireStudent(authentication, request.getStudentId());

        ExpedientResponse created = expedientService.createExpedient(request, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * {@code GET /api/expedients}
     *
     * @param pageable page, size and sort (child's first name by default)
     * @param authentication current user
     * @return records of active children; for a teacher, only those in their groups
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Page<ExpedientResponse>> getAllExpedients(
        @PageableDefault(size = 10, sort = "child.firstName") Pageable pageable,
        @RequestParam(required = false) String search,
        Authentication authentication) {
        Page<ExpedientResponse> expedients = teacherScope.visibleChildIds(authentication)
                .map(childIds -> expedientService.getExpedientsForChildren(childIds, pageable, search))
                .orElseGet(() -> expedientService.getAllExpedients(pageable, search));
        return ResponseEntity.ok(expedients);
    }

    /**
     * {@code GET /api/expedients/student/{studentId}}
     *
     * @param studentId child's student ID
     * @param authentication current user
     * @return the child's record, or 404 if the child or the record does not exist
     */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<ExpedientResponse> getExpedientByStudentId(@PathVariable String studentId,
            Authentication authentication) {
        Long childId = expedientService.findChildIdByStudentId(studentId.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Child not found"));
        teacherScope.requireChild(authentication, childId);
        return ResponseEntity.ok(expedientService.getExpedientByStudentId(studentId.trim()));
    }

    /**
     * {@code GET /api/expedients/{id}}
     *
     * @param id record ID
     * @param authentication current user
     * @return the record
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<ExpedientResponse> getExpedientById(@PathVariable UUID id, Authentication authentication) {
        teacherScope.requireChild(authentication, expedientService.getChildId(id));
        ExpedientResponse expedient = expedientService.getExpedientById(id);
        return ResponseEntity.ok(expedient);
    }

    /**
     * {@code DELETE /api/expedients/{id}/photo}
     *
     * @param id record ID
     * @param authentication current user
     * @return 204
     */
    @DeleteMapping("/{id}/photo")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Void> deletePhoto(@PathVariable UUID id, Authentication authentication) {
        teacherScope.requireChild(authentication, expedientService.getChildId(id));
        expedientService.deletePhoto(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code DELETE /api/expedients/{id}}: deletes the record, its evaluations and its photo.
     *
     * @param id record ID
     * @param authentication current user
     * @return 204
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Void> deleteExpedient(@PathVariable UUID id, Authentication authentication) {
        teacherScope.requireChild(authentication, expedientService.getChildId(id));
        expedientService.deleteExpedient(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code PUT /api/expedients/{id}}, multipart: updates the record and optionally its photo.
     *
     * @param id record ID
     * @param requestJson new data as JSON
     * @param file new photo, optional
     * @param authentication current user
     * @return the updated record
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<ExpedientResponse> uploadOrUpdatePhoto(
            @PathVariable UUID id,
            @RequestParam("data") String requestJson,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication authentication) {

        teacherScope.requireChild(authentication, expedientService.getChildId(id));
        ExpedientRequest request = readRequest(requestJson);
        requireStudent(authentication, request.getStudentId());
        ExpedientResponse updated = expedientService.uploadOrUpdatePhoto(id, request, file);
        return ResponseEntity.ok(updated);
    }

    /**
     * @param authentication current user
     * @param studentId student ID sent in the form, may be blank
     * @throws ResponseStatusException with 403 if a teacher uses a student outside their groups
     */
    private void requireStudent(Authentication authentication, String studentId) {
        if (studentId == null || studentId.isBlank()) {
            return;
        }
        expedientService.findChildIdByStudentId(studentId.trim())
                .ifPresent(childId -> teacherScope.requireChild(authentication, childId));
    }

    /**
     * @param requestJson the record's data as JSON, sent in the multipart form
     * @return the parsed request
     * @throws IllegalArgumentException if it is not valid JSON, answered with a 400
     */
    private ExpedientRequest readRequest(String requestJson) {
        try {
            return objectMapper.readValue(requestJson, ExpedientRequest.class);
        } catch (JacksonException e) {
            throw new IllegalArgumentException("The record data is not valid.");
        }
    }
}
