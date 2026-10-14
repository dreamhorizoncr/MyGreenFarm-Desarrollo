import { apiClient } from "./api";

import type { Child, ChildPage, ChildRequest } from "../types/child";
import type { ClubResponse } from "../types/clubs";

export interface ChildOption {
  studentId: string;
  childName: string;
  fullName: string;
}

export interface TranslationItem {
  entityId: string;
  fieldName: string;
  originalText: string;
}

export const childService = {
  // Obtiene todos los niños
  async getAll(page = 0, size = 10): Promise<ChildPage> {
    const response = await apiClient.get<ChildPage>("/child", {
      params: { page, size },
    });
    return response.data;
  },

  // Obtiene un niño por su ID
  async getById(id: number): Promise<Child> {
    const response = await apiClient.get<Child>(`/child/${id}`);
    return response.data;
  },

  // Obtiene los niños asociados a un padre
  async getByParent(parentId: number): Promise<ChildPage> {
    const response = await apiClient.get<ChildPage>(
      `/child/parent/${parentId}`,
    );

    return response.data;
  },

  // Crea un niño
  async create(data: ChildRequest): Promise<Child> {
    const response = await apiClient.post<Child>("/child", data);
    return response.data;
  },

  // Actualiza un niño
  async update(id: number, data: ChildRequest): Promise<Child> {
    const response = await apiClient.put<Child>(`/child/${id}`, data);
    return response.data;
  },

  // Elimina un niño
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/child/${id}`);
  },

  // Obtiene las opciones de niños para selectors/dropdowns
  async getChildrenOptions(): Promise<ChildOption[]> {
    const response = await apiClient.get<ChildOption[]>("/child/options");
    return response.data;
  },

  async getAvailableForExpedient(): Promise<Child[]> {
    const response = await apiClient.get<Child[]>("/child/available-for-expedient");
    return response.data;
  },

  async getAvailableForExpedientOptions(): Promise<ChildOption[]> {
    const response = await apiClient.get<Child[]>("/child/available-for-expedient");
    return response.data.map((child) => ({
      studentId: child.studentId,
      childName: `${child.firstName} ${child.lastName}`,
      fullName: `${child.firstName} ${child.lastName}`,
    }));
  },

  async translateBatch(entityType: string, targetLanguage: string, items: TranslationItem[]): Promise<Record<string, string>> {
    if (items.length === 0) return {}
    const response = await apiClient.post<Record<string, string>>("/translations/batch", {
      entityType,
      targetLanguage: targetLanguage?.split('-')[0] || 'es',
      items,
    });
    return response.data;
  },


};
