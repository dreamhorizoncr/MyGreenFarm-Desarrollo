import { apiClient, type PageResponse } from "./api.ts";

import type { Parent, ParentRequest } from "../types/parent.ts";

export const parentService = {
  // Obtiene todos los padres.
    async getParents(page = 0, size = 10): Promise<PageResponse<Parent>> {
        const response = await apiClient.get<PageResponse<Parent>>("/parents", { params: { page, size } });
        return response.data;
    },

  // Obtiene un padre por su ID.
    async getById(id: number): Promise<Parent> {
        const response = await apiClient.get<Parent>(`/parents/${id}`);
        return response.data;
    },

  // Crea un nuevo padre.
    async create(data: ParentRequest): Promise<Parent> {
        const response = await apiClient.post<Parent>("/parents", data);
        return response.data;
    },

  // Actualiza un padre.
    async update(id: number, data: ParentRequest): Promise<Parent> {
        const response = await apiClient.put<Parent>(`/parents/${id}`, data);
        return response.data;
    },

  // Elimina un padre.
    async delete(id: number): Promise<void> {
        await apiClient.delete(`/parents/${id}`);
    },
};
