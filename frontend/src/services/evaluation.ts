import { apiClient } from "./api";
import type {
    Evaluation,
    EvaluationRequest,
} from "../types/evaluation";
import type { TranslationItem } from "./expedient";

export const evaluationService = {
    async getAll(): Promise<Evaluation[]> {
        const response = await apiClient.get<Evaluation[]>("/evaluations");
        return response.data;
    },

    async getById(id: string): Promise<Evaluation> {
        const response = await apiClient.get<Evaluation>(`/evaluations/${id}`);
        return response.data;
    },

    async getByExpedient(expedientId: string): Promise<Evaluation[]> {
        const response = await apiClient.get<Evaluation[]>(
        `/evaluations/expedient/${expedientId}`
        );

        return response.data;
    },

    async create(data: EvaluationRequest): Promise<Evaluation> {
        const response = await apiClient.post<Evaluation>(
        "/evaluations",
        data
        );

        return response.data;
    },

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

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/evaluations/${id}`);
    },

    async sendSemiannualSummaries(): Promise<string> {
        const response = await apiClient.post<string>(
        "/evaluations/send-semiannual-summaries"
        );

        return response.data;
    },

    async translateBatch(entityType: string, targetLanguage: string, items: TranslationItem[]): Promise<Record<string, string>> {
        if (items.length === 0) return {}
        const response = await apiClient.post<Record<string, string>>(
        "/translations/batch",
        {
            entityType,
            targetLanguage: targetLanguage?.split('-')[0] || 'es',
            items,
        }
        );

        return response.data;
    },
};