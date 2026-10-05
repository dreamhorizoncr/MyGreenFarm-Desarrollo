import { apiClient } from "./api";

import type { Child, ChildPage, ChildRequest } from "../types/child";

export interface ChildOption {
  studentId: string;
  childName: string;
  fullName: string;
}

export const childService = {
  // Obtiene todos los niños
  async getAll(): Promise<ChildPage> {
    const response = await apiClient.get<ChildPage>("/child");
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
};
