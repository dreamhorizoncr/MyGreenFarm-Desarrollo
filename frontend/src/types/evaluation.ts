/** Progress evaluation of a child, by area. */
export interface Evaluation {
    id: string;
    evaluationDate: string;
    /** Record of the evaluated child. */
    expedientId: string;
    communicationProgress: string;
    languageProgress: string;
    readingProgress: string;
    motorProgress: string;
    teacherObservation: string;
}

/** Data to create or update an evaluation. */
export interface EvaluationRequest {
    expedientId: string;
    evaluationDate: string;
    communicationProgress: string;
    languageProgress: string;
    readingProgress: string;
    motorProgress: string;
    teacherObservation: string;
}