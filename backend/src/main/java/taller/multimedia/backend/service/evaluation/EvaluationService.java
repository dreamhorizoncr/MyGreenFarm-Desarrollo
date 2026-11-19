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
import taller.multimedia.backend.util.Sanitizer;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Progress evaluations that teachers write for a student's record (communication, language,
 * reading, motor skills and observations). The texts are sanitized and keep their line breaks.
 */
@Service
@RequiredArgsConstructor
public class EvaluationService {

        private final EvaluationRepository evaluationRepository;
        private final ExpedientRepository expedientRepository;

        /**
         * @param request record and evaluation texts
         * @return the saved evaluation
         * @throws RuntimeException if the record does not exist
         * @throws taller.multimedia.backend.exception.InvalidFieldException if a text is unsafe
         */
        @Transactional
        public Evaluation createEvaluation(EvaluationRequest request) {
                Expedient expedient = expedientRepository.findById(request.getExpedientId())
                                .orElseThrow(() -> new RuntimeException(
                                                "Record not found with ID: " + request.getExpedientId()));

                Evaluation evaluation = new Evaluation();
                evaluation.setEvaluationDate(request.getEvaluationDate());
                evaluation.setExpedient(expedient);
                evaluation.setCommunicationProgress(
                                Sanitizer.requireCleanPreserveLineBreaks("communicationProgress",
                                                request.getCommunicationProgress()));
                evaluation.setLanguageProgress(
                                Sanitizer.requireCleanPreserveLineBreaks("languageProgress",
                                                request.getLanguageProgress()));
                evaluation.setReadingProgress(
                                Sanitizer.requireCleanPreserveLineBreaks("readingProgress",
                                                request.getReadingProgress()));
                evaluation.setMotorProgress(
                                Sanitizer.requireCleanPreserveLineBreaks("motorProgress", request.getMotorProgress()));
                evaluation.setTeacherObservation(
                                Sanitizer.requireCleanPreserveLineBreaks("teacherObservation",
                                                request.getTeacherObservation()));

                return evaluationRepository.save(evaluation);
        }

        /**
         * @return every evaluation; for owners and admins
         */
        @Transactional(readOnly = true)
        public List<EvaluationResponse> getAllEvaluations() {
                return evaluationRepository.findAll().stream()
                                .map(this::toResponse)
                                .collect(Collectors.toList());
        }

        /**
         * @param childIds children the user may see
         * @return the evaluations of those children; used to limit what a teacher sees
         */
        @Transactional(readOnly = true)
        public List<EvaluationResponse> getEvaluationsForChildren(java.util.Set<Long> childIds) {
                if (childIds.isEmpty()) {
                        return List.of();
                }
                return evaluationRepository.findByChildIds(childIds).stream()
                                .map(this::toResponse)
                                .collect(Collectors.toList());
        }

        /**
         * @param evaluationId evaluation ID
         * @return the child the evaluation belongs to, to check a teacher's access
         * @throws RuntimeException if the evaluation does not exist
         */
        @Transactional(readOnly = true)
        public Long getChildId(UUID evaluationId) {
                return getEvaluationById(evaluationId).getExpedient().getChild().getId();
        }

        /**
         * @param expedientId record ID
         * @return the child the record belongs to, to check a teacher's access
         * @throws RuntimeException if the record does not exist
         */
        @Transactional(readOnly = true)
        public Long getChildIdOfExpedient(UUID expedientId) {
                return expedientRepository.findById(expedientId)
                                .orElseThrow(() -> new RuntimeException("Record not found with ID: " + expedientId))
                                .getChild().getId();
        }

        /**
         * @param expedientId record ID
         * @return the record's evaluations
         */
        @Transactional(readOnly = true)
        public List<Evaluation> getEvaluationsByExpedient(UUID expedientId) {
                return evaluationRepository.findByExpedientId(expedientId);
        }

        /**
         * @param id evaluation ID
         * @return the evaluation
         * @throws RuntimeException if it does not exist
         */
        @Transactional(readOnly = true)
        public Evaluation getEvaluationById(UUID id) {
                return evaluationRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Evaluation not found with ID: " + id));
        }

        /**
         * @param id evaluation ID
         * @param request new record and texts
         * @return the updated evaluation
         * @throws RuntimeException if the evaluation or record does not exist
         * @throws taller.multimedia.backend.exception.InvalidFieldException if a text is unsafe
         */
        @Transactional
        public Evaluation updateEvaluation(UUID id, EvaluationRequest request) {
                Evaluation existingEvaluation = getEvaluationById(id);

                Expedient expedient = expedientRepository.findById(request.getExpedientId())
                                .orElseThrow(() -> new RuntimeException(
                                                "Record not found with ID: " + request.getExpedientId()));

                existingEvaluation.setEvaluationDate(request.getEvaluationDate());
                existingEvaluation.setExpedient(expedient);
                existingEvaluation.setCommunicationProgress(
                                Sanitizer.requireCleanPreserveLineBreaks("communicationProgress",
                                                request.getCommunicationProgress()));
                existingEvaluation.setLanguageProgress(
                                Sanitizer.requireCleanPreserveLineBreaks("languageProgress",
                                                request.getLanguageProgress()));
                existingEvaluation.setReadingProgress(
                                Sanitizer.requireCleanPreserveLineBreaks("readingProgress",
                                                request.getReadingProgress()));
                existingEvaluation.setMotorProgress(
                                Sanitizer.requireCleanPreserveLineBreaks("motorProgress", request.getMotorProgress()));
                existingEvaluation.setTeacherObservation(
                                Sanitizer.requireCleanPreserveLineBreaks("teacherObservation",
                                                request.getTeacherObservation()));

                return evaluationRepository.save(existingEvaluation);
        }

        /**
         * @param id evaluation ID
         * @throws RuntimeException if it does not exist
         */
        @Transactional
        public void deleteEvaluation(UUID id) {
                Evaluation evaluation = getEvaluationById(id);
                evaluationRepository.delete(evaluation);
        }

        /**

         * @param evaluation stored evaluation

         * @return the evaluation as returned by the API, with the record's ID instead of the record

         */

        public EvaluationResponse toResponse(Evaluation evaluation) {
                UUID expedientId = null;
                if (evaluation.getExpedient() != null) {
                        expedientId = evaluation.getExpedient().getId();
                }

                return new EvaluationResponse(
                                evaluation.getId(),
                                evaluation.getEvaluationDate(),
                                expedientId,
                                evaluation.getCommunicationProgress(),
                                evaluation.getLanguageProgress(),
                                evaluation.getReadingProgress(),
                                evaluation.getMotorProgress(),
                                evaluation.getTeacherObservation());
        }
}
