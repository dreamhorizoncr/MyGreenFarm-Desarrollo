import { apiClient } from "./api";
import type {
    Evaluation,
    EvaluationRequest,
} from "../types/evaluation";
import { translateBatch } from "./translation.ts";

/** Progress evaluations of the children (`/api/evaluations`). */
export const evaluationService = {
    /** @returns the evaluations the signed-in user can see */
    async getAll(): Promise<Evaluation[]> {
        const response = await apiClient.get<Evaluation[]>("/evaluations");
        return response.data;
    },

    /**
     * @param id - evaluation's ID
     * @returns the evaluation
     */
    async getById(id: string): Promise<Evaluation> {
        const response = await apiClient.get<Evaluation>(`/evaluations/${id}`);
        return response.data;
    },

    /**
     * @param expedientId - record's ID
     * @returns the evaluations of that record
     */
    async getByExpedient(expedientId: string): Promise<Evaluation[]> {
        const response = await apiClient.get<Evaluation[]>(
        `/evaluations/expedient/${expedientId}`
        );

        return response.data;
    },

    /**
     * @param data - the record and the progress in each area
     * @returns the created evaluation
     */
    async create(data: EvaluationRequest): Promise<Evaluation> {
        const response = await apiClient.post<Evaluation>(
        "/evaluations",
        data
        );

        return response.data;
    },

    /**
     * @param id - evaluation's ID
     * @param data - new data
     * @returns the updated evaluation
     */
    async update(
        id: string,
        data: EvaluationRequest
    ): Promise<Evaluation> {
        const response = await apiClient.put<Evaluation>(
        `/evaluations/${id}`,
        data
        );

        return response.data;
    },

    /** @param id - ID of the evaluation to delete */
    async delete(id: string): Promise<void> {
        await apiClient.delete(`/evaluations/${id}`);
    },

    /**
     * Emails every parent the summary of their children's evaluations of the last six months. Only the
     * owner and admins may do it.
     *
     * @returns the backend's confirmation
     */
    async sendSemiannualSummaries(): Promise<string> {
        const response = await apiClient.post<string>(
        "/evaluations/send-semiannual-summaries"
        );

        return response.data;
    },

    translateBatch,
};
