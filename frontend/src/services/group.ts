
import { apiClient } from "./api";

import type { Group, GroupRequest } from "../types/group";

    export const groupService = {
    async getAll(): Promise<Group[]> {
        const response = await apiClient.get<Group[]>("/groups");
        return response.data;
    },

    async getById(id: number): Promise<Group> {
        const response = await apiClient.get<Group>(`/groups/${id}`);
        return response.data;
    },

    async getByTeacher(teacherId: string): Promise<Group[]> {
        const response = await apiClient.get<Group[]>(
        `/groups/teacher/${teacherId}`,
        );
        return response.data;
    },

    async create(data: GroupRequest): Promise<Group> {
        const response = await apiClient.post<Group>("/groups", data);
        return response.data;
    },

    async update(id: number, data: GroupRequest): Promise<Group> {
        const response = await apiClient.put<Group>(
        `/groups/${id}`,
        data,
        );
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await apiClient.delete(`/groups/${id}`);
    },
};
