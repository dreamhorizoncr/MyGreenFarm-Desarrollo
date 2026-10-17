import { apiClient , type PageResponse } from "./api.ts";
import { sanitizeFileName } from "../utils/sanitizeFileName.ts";

import type { Expedient, ExpedientRequest } from "../types/expedient.ts";

export interface TranslationItem {
  entityId: string
  fieldName: string
  originalText: string
}

export const expedientService = {
  async getExpedients(page = 0, size = 10): Promise<PageResponse<Expedient>> {
    const response = await apiClient.get<PageResponse<Expedient>>("/expedients", { params: { page, size } });
    return response.data;
  },

  async getById(id: string): Promise<Expedient> {
    const response = await apiClient.get<Expedient>(`/expedients/${id}`);
    return response.data;
  },

  async create(data: ExpedientRequest, file?: File): Promise<Expedient> {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));

    if (file) {
      const sanitizedFile = new File([file], sanitizeFileName(file.name), {
        type: file.type,
      });
      formData.append("file", sanitizedFile);
    }

    const response = await apiClient.post<Expedient>("/expedients", formData, {
      headers: { "Content-Type": undefined },
    });

    return response.data;
  },

  async update(
    id: string,
    data: ExpedientRequest,
    file?: File,
  ): Promise<Expedient> {
    const formData = new FormData();

    formData.append("data", JSON.stringify(data));

    if (file) {
      const sanitizedFile = new File([file], sanitizeFileName(file.name), {
        type: file.type,
      });

      formData.append("file", sanitizedFile);
    }

    const response = await apiClient.put<Expedient>(
      `/expedients/${id}`,
      formData,
      {
        headers: { "Content-Type": undefined },
      },
    );

    return response.data;
  },

  async deletePhoto(id: string): Promise<void> {
    await apiClient.delete(`/expedients/${id}/photo`);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/expedients/${id}`);
  },

  async translateBatch(entityType: string, targetLanguage: string, items: TranslationItem[]): Promise<Record<string, string>> {
    if (items.length === 0) return {}
    const response = await apiClient.post<Record<string, string>>('/translations/batch', {
      entityType,
      targetLanguage: targetLanguage?.split('-')[0] || 'es',
      items,
    })
    return response.data
  },
};
