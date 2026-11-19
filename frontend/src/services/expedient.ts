import { apiClient } from "./api.ts";
import type { PageResponse } from "../types/page.ts";
import { withSafeName } from "../utils/sanitizeFileName.ts";

import type { Expedient, ExpedientRequest } from "../types/expedient.ts";
import { translateBatch } from "./translation.ts";

/** Records of the children (`/api/expedients`). */
export const expedientService = {
  /**
   * @param page - page number, starting at 0
   * @param size - records per page
   * @param search - text to look for in the child's name, student ID and observations, optional
   * @returns one page of records
   */
  async getExpedients(page = 0, size = 10, search?: string): Promise<PageResponse<Expedient>> {
    const response = await apiClient.get<PageResponse<Expedient>>("/expedients", { params: { page, size, search: search || undefined } });
    return response.data;
  },

  /**
   * @param studentId - child's student ID
   * @returns the child's record
   */
  async getByStudentId(studentId: string): Promise<Expedient> {
    const response = await apiClient.get<Expedient>(`/expedients/student/${encodeURIComponent(studentId)}`);
    return response.data;
  },

  /**
   * @param id - record's ID
   * @returns the record
   */
  async getById(id: string): Promise<Expedient> {
    const response = await apiClient.get<Expedient>(`/expedients/${id}`);
    return response.data;
  },

  /**
   * @param data - the record's data
   * @param file - the child's photo, optional
   * @returns the created record
   */
  async create(data: ExpedientRequest, file?: File): Promise<Expedient> {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));

    if (file) {
      formData.append("file", withSafeName(file));
    }

    const response = await apiClient.post<Expedient>("/expedients", formData, {
      headers: { "Content-Type": undefined },
    });

    return response.data;
  },

  /**
   * @param id - record's ID
   * @param data - new data
   * @param file - new photo, optional
   * @returns the updated record
   */
  async update(
    id: string,
    data: ExpedientRequest,
    file?: File,
  ): Promise<Expedient> {
    const formData = new FormData();

    formData.append("data", JSON.stringify(data));

    if (file) {
      formData.append("file", withSafeName(file));
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

  /** @param id - ID of the record whose photo is removed */
  async deletePhoto(id: string): Promise<void> {
    await apiClient.delete(`/expedients/${id}/photo`);
  },

  /** @param id - ID of the record to delete */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/expedients/${id}`);
  },

  translateBatch,
};
