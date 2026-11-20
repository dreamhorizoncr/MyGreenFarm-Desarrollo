package taller.multimedia.backend.controller.evaluation;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.evaluation.EvaluationRequest;
import taller.multimedia.backend.dto.evaluation.EvaluationResponse;
import taller.multimedia.backend.model.evaluation.Evaluation;
import taller.multimedia.backend.service.evaluation.EvaluationService;
import taller.multimedia.backend.service.evaluation.EvaluationSummaryService;
import taller.multimedia.backend.service.group.TeacherScopeService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Progress evaluations of students. Teachers only see and change the evaluations of the children in
 * their groups.
 */
@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;
    private final EvaluationSummaryService evaluationSummaryService;
    private final TeacherScopeService teacherScope;

    /**
     * {@code POST /api/evaluations}
     *
     * @param request record and evaluation texts
     * @param authentication current user
     * @return 201 with the saved evaluation
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<EvaluationResponse> createEvaluation(@Valid @RequestBody EvaluationRequest request,
            Authentication authentication) {
        teacherScope.requireChild(authentication, evaluationService.getChildIdOfExpedient(request.getExpedientId()));
        Evaluation newEvaluation = evaluationService.createEvaluation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(evaluationService.toResponse(newEvaluation));
    }

    /**
     * {@code GET /api/evaluations}
     *
     * @param authentication current user
     * @return every evaluation, or only those of the teacher's students
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<EvaluationResponse>> getAllEvaluations(Authentication authentication) {
        List<EvaluationResponse> evaluations = teacherScope.visibleChildIds(authentication)
                .map(evaluationService::getEvaluationsForChildren)
                .orElseGet(evaluationService::getAllEvaluations);
        return ResponseEntity.ok(evaluations);
    }

    /**
     * {@code GET /api/evaluations/expedient/{expedientId}}
     *
     * @param expedientId record ID
     * @param authentication current user
     * @return the record's evaluations
     */
    @GetMapping("/expedient/{expedientId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<EvaluationResponse>> getEvaluationsByExpedient(@PathVariable UUID expedientId,
            Authentication authentication) {
        teacherScope.requireChild(authentication, evaluationService.getChildIdOfExpedient(expedientId));
        List<EvaluationResponse> evaluations = evaluationService.getEvaluationsByExpedient(expedientId).stream()
                .map(evaluationService::toResponse)
                .toList();
        return ResponseEntity.ok(evaluations);
    }

    /**
     * {@code GET /api/evaluations/{id}}
     *
     * @param id evaluation ID
     * @param authentication current user
     * @return the evaluation
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<EvaluationResponse> getEvaluationById(@PathVariable UUID id, Authentication authentication) {
        teacherScope.requireChild(authentication, evaluationService.getChildId(id));
        Evaluation evaluation = evaluationService.getEvaluationById(id);
        return ResponseEntity.ok(evaluationService.toResponse(evaluation));
    }

    /**
     * {@code PUT /api/evaluations/{id}}: a teacher must have access both to the current and to the
     * new record.
     *
     * @param id evaluation ID
     * @param request new record and texts
     * @param authentication current user
     * @return the updated evaluation
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<EvaluationResponse> updateEvaluation(@PathVariable UUID id, @Valid @RequestBody EvaluationRequest request,
            Authentication authentication) {
        teacherScope.requireChild(authentication, evaluationService.getChildId(id));
        teacherScope.requireChild(authentication, evaluationService.getChildIdOfExpedient(request.getExpedientId()));
        Evaluation updatedEvaluation = evaluationService.updateEvaluation(id, request);
        return ResponseEntity.ok(evaluationService.toResponse(updatedEvaluation));
    }

    /**
     * {@code DELETE /api/evaluations/{id}}
     *
     * @param id evaluation ID
     * @param authentication current user
     * @return 204
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Void> deleteEvaluation(@PathVariable UUID id, Authentication authentication) {
        teacherScope.requireChild(authentication, evaluationService.getChildId(id));
        evaluationService.deleteEvaluation(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code POST /api/evaluations/send-semiannual-summaries}: generates and emails the semiannual
     * summaries now, instead of waiting for June 30 or December 30.
     *
     * @return a confirmation message
     */
    @PostMapping("/send-semiannual-summaries")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<String> sendSemiannualSummaries() {
        evaluationSummaryService.generateAndSendSemiannualSummaries();
        return ResponseEntity.ok("Semester summary generation and delivery finished successfully.");
    }
}
