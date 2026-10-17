import { apiClient } from "./api";

import type { Child, ChildPage, ChildRequest } from "../types/child";

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
  async getAll(): Promise<ChildPage> {
    const response = await apiClient.get<ChildPage>("/child");
    return response.data;
  },

  async getById(id: number): Promise<Child> {
    const response = await apiClient.get<Child>(`/child/${id}`);
    return response.data;
  },

  async getByParent(parentId: number): Promise<ChildPage> {
    const response = await apiClient.get<ChildPage>(
      `/child/parent/${parentId}`,
    );

    return response.data;
  },

  async create(data: ChildRequest): Promise<Child> {
    const response = await apiClient.post<Child>("/child", data);
    return response.data;
  },

  async update(id: number, data: ChildRequest): Promise<Child> {
    const response = await apiClient.put<Child>(`/child/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/child/${id}`);
  },

  async getChildrenOptions(): Promise<ChildOption[]> {
    const response = await apiClient.get<ChildOption[]>("/child/options");
    return response.data;
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
