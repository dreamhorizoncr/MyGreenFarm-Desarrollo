package taller.multimedia.backend.controller.evaluation;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.evaluation.EvaluationRequest;
import taller.multimedia.backend.dto.expedient.ExpedientResponse;
import taller.multimedia.backend.model.evaluation.Evaluation;
import taller.multimedia.backend.service.evaluation.EvaluationService;

import org.springframework.ai.evaluation.EvaluationResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    @PostMapping
    public ResponseEntity<Evaluation> createEvaluation(@Valid @RequestBody EvaluationRequest request) {
        Evaluation newEvaluation = evaluationService.createEvaluation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(newEvaluation);
    }

    @GetMapping
    public ResponseEntity<List<EvaluationResponse>> getAllEvaluations() {
        List<EvaluationResponse> evaluations = evaluationService.getAllEvaluations();
        return ResponseEntity.ok(evaluations);
    }

    @GetMapping("/expedient/{expedientId}")
    public ResponseEntity<List<Evaluation>> getEvaluationsByExpedient(@PathVariable UUID expedientId) {
        List<Evaluation> evaluations = evaluationService.getEvaluationsByExpedient(expedientId);
        return ResponseEntity.ok(evaluations);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Evaluation> getEvaluationById(@PathVariable UUID id) {
        Evaluation evaluation = evaluationService.getEvaluationById(id);
        return ResponseEntity.ok(evaluation);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Evaluation> updateEvaluation(@PathVariable UUID id, @Valid @RequestBody EvaluationRequest request) {
        Evaluation updatedEvaluation = evaluationService.updateEvaluation(id, request);
        return ResponseEntity.ok(updatedEvaluation);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvaluation(@PathVariable UUID id) {
        evaluationService.deleteEvaluation(id);
        return ResponseEntity.noContent().build();
    }
}
