import { apiClient } from "./api.ts";
import type { PageResponse } from "../types/page.ts";

import type { Parent, ParentRequest } from "../types/parent.ts";

/** Parents of the children (`/api/parents`), managed by the owner and admins. */
export const parentService = {
    /**
     * @param page - page number, starting at 0
     * @param size - parents per page
     * @param search - text to look for in the name, identification, email and phone, optional
     * @returns one page of parents
     */
    async getParents(page = 0, size = 10, search?: string): Promise<PageResponse<Parent>> {
        const response = await apiClient.get<PageResponse<Parent>>("/parents", { params: { page, size, search: search || undefined } });
        return response.data;
    },

    /**
     * @param id - parent's ID
     * @returns the parent
     */
    async getById(id: number): Promise<Parent> {
        const response = await apiClient.get<Parent>(`/parents/${id}`);
        return response.data;
    },

    /**
     * @param data - parent's data
     * @returns the created parent
     */
    async create(data: ParentRequest): Promise<Parent> {
        const response = await apiClient.post<Parent>("/parents", data);
        return response.data;
    },

    /**
     * @param id - parent's ID
     * @param data - new data
     * @returns the updated parent
     */
    async update(id: number, data: ParentRequest): Promise<Parent> {
        const response = await apiClient.put<Parent>(`/parents/${id}`, data);
        return response.data;
    },

    /** @param id - ID of the parent to delete */
    async delete(id: number): Promise<void> {
        await apiClient.delete(`/parents/${id}`);
    },
};
