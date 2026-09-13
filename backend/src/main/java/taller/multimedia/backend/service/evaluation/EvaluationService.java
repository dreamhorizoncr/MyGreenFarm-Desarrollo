package taller.multimedia.backend.service.evaluation;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import taller.multimedia.backend.dto.evaluation.EvaluationRequest;
import taller.multimedia.backend.dto.evaluation.EvaluationResponse;
import taller.multimedia.backend.model.evaluation.Evaluation;
import taller.multimedia.backend.model.expedient.Expedient;
import taller.multimedia.backend.repository.evaluation.EvaluationRepository;
import taller.multimedia.backend.repository.expedient.ExpedientRepository;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final EvaluationRepository evaluationRepository;
    private final ExpedientRepository expedientRepository; 

    @Transactional
    public Evaluation createEvaluation(EvaluationRequest request) {
        // Verificar que el Expediente exista antes de asociarlo
        Expedient expedient = expedientRepository.findById(request.getExpedientId())
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado con ID: " + request.getExpedientId()));

        Evaluation evaluation = new Evaluation();
        evaluation.setEvaluationDate(request.getEvaluationDate());
        evaluation.setExpedientId(expedient);
        evaluation.setCommunicationProgress(request.getCommunicationProgress());
        evaluation.setLanguageProgress(request.getLanguageProgress());
        evaluation.setReadingProgress(request.getReadingProgress());
        evaluation.setMotorProgress(request.getMotorProgress());
        evaluation.setTeacherObservation(request.getTeacherObservation());

        return evaluationRepository.save(evaluation);
    }

    @Transactional(readOnly = true)
    public List<EvaluationResponse> getAllEvaluations() {
        return evaluationRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Evaluation> getEvaluationsByExpedient(UUID expedientId) {
        return evaluationRepository.findByExpedientIdId(expedientId);
    }

    @Transactional(readOnly = true)
    public Evaluation getEvaluationById(UUID id) {
        return evaluationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evaluación no encontrada con ID: " + id));
    }

    @Transactional
    public Evaluation updateEvaluation(UUID id, EvaluationRequest request) {
        Evaluation existingEvaluation = getEvaluationById(id);

        Expedient expedient = expedientRepository.findById(request.getExpedientId())
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado con ID: " + request.getExpedientId()));

        existingEvaluation.setEvaluationDate(request.getEvaluationDate());
        existingEvaluation.setExpedientId(expedient);
        existingEvaluation.setCommunicationProgress(request.getCommunicationProgress());
        existingEvaluation.setLanguageProgress(request.getLanguageProgress());
        existingEvaluation.setReadingProgress(request.getReadingProgress());
        existingEvaluation.setMotorProgress(request.getMotorProgress());
        existingEvaluation.setTeacherObservation(request.getTeacherObservation());

        return evaluationRepository.save(existingEvaluation);
    }

    @Transactional
    public void deleteEvaluation(UUID id) {
        Evaluation evaluation = getEvaluationById(id);
        evaluationRepository.delete(evaluation);
    }

    private EvaluationResponse mapToResponse(Evaluation evaluation) {
        UUID expId = null;
        if (evaluation.getExpedientId() != null) {
            expId = evaluation.getExpedientId().getId();
        }

        return new EvaluationResponse(
                evaluation.getId(),
                evaluation.getEvaluationDate(),
                expId,
                evaluation.getCommunicationProgress(),
                evaluation.getLanguageProgress(),
                evaluation.getReadingProgress(),
                evaluation.getMotorProgress(),
                evaluation.getTeacherObservation()
        );
    }
}
