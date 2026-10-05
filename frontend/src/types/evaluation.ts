export interface Evaluation {
    id: string;
    evaluationDate: string;
    expedientId: string;
    communicationProgress: string;
    languageProgress: string;
    readingProgress: string;
    motorProgress: string;
    teacherObservation: string;
}

export interface EvaluationRequest {
    expedientId: string;
    evaluationDate: string;
    communicationProgress: string;
    languageProgress: string;
    readingProgress: string;
    motorProgress: string;
    teacherObservation: string;
}