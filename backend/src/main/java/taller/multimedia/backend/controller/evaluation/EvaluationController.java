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

@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;
    private final EvaluationSummaryService evaluationSummaryService;
    private final TeacherScopeService teacherScope;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Evaluation> createEvaluation(@Valid @RequestBody EvaluationRequest request,
            Authentication authentication) {
        teacherScope.requireChild(authentication, evaluationService.getChildIdOfExpedient(request.getExpedientId()));
        Evaluation newEvaluation = evaluationService.createEvaluation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(newEvaluation);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<EvaluationResponse>> getAllEvaluations(Authentication authentication) {
        List<EvaluationResponse> evaluations = teacherScope.visibleChildIds(authentication)
                .map(evaluationService::getEvaluationsForChildren)
                .orElseGet(evaluationService::getAllEvaluations);
        return ResponseEntity.ok(evaluations);
    }

    @GetMapping("/expedient/{expedientId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Evaluation>> getEvaluationsByExpedient(@PathVariable UUID expedientId,
            Authentication authentication) {
        teacherScope.requireChild(authentication, evaluationService.getChildIdOfExpedient(expedientId));
        List<Evaluation> evaluations = evaluationService.getEvaluationsByExpedient(expedientId);
        return ResponseEntity.ok(evaluations);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Evaluation> getEvaluationById(@PathVariable UUID id, Authentication authentication) {
        teacherScope.requireChild(authentication, evaluationService.getChildId(id));
        Evaluation evaluation = evaluationService.getEvaluationById(id);
        return ResponseEntity.ok(evaluation);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Evaluation> updateEvaluation(@PathVariable UUID id, @Valid @RequestBody EvaluationRequest request,
            Authentication authentication) {
        teacherScope.requireChild(authentication, evaluationService.getChildId(id));
        teacherScope.requireChild(authentication, evaluationService.getChildIdOfExpedient(request.getExpedientId()));
        Evaluation updatedEvaluation = evaluationService.updateEvaluation(id, request);
        return ResponseEntity.ok(updatedEvaluation);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Void> deleteEvaluation(@PathVariable UUID id, Authentication authentication) {
        teacherScope.requireChild(authentication, evaluationService.getChildId(id));
        evaluationService.deleteEvaluation(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/send-semiannual-summaries")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<String> sendSemiannualSummaries() {
        evaluationSummaryService.generateAndSendSemiannualSummaries();
        return ResponseEntity.ok("Semester summary generation and delivery finished successfully.");
    }
}
