import { apiClient } from "./api";

import type { Group, GroupRequest } from "../types/group";

/** Groups of children and their teachers (`/api/groups`). */
export const groupService = {
    /** @returns all the groups */
    async getAll(): Promise<Group[]> {
        const response = await apiClient.get<Group[]>("/groups");
        return response.data;
    },

    /**
     * @param id - group's ID
     * @returns the group
     */
    async getById(id: number): Promise<Group> {
        const response = await apiClient.get<Group>(`/groups/${id}`);
        return response.data;
    },

    /**
     * @param teacherId - teacher's ID
     * @returns the groups the teacher leads
     */
    async getByTeacher(teacherId: string): Promise<Group[]> {
        const response = await apiClient.get<Group[]>(
            `/groups/teacher/${teacherId}`,
        );
        return response.data;
    },

    /**
     * @param groupId - group's ID
     * @param childId - child to add
     * @returns the group with the child
     */
    async addChild(groupId: number, childId: number): Promise<Group> {
        const response = await apiClient.post<Group>(
            `/groups/${groupId}/children/${childId}`,
        );
        return response.data;
    },

    /**
     * @param groupId - group's ID
     * @param childId - child to remove
     * @returns the group without the child
     */
    async removeChild(groupId: number, childId: number): Promise<Group> {
        const response = await apiClient.delete<Group>(
            `/groups/${groupId}/children/${childId}`,
        );
        return response.data;
    },

    /**
     * @param data - name, teachers and description
     * @returns the created group
     */
    async create(data: GroupRequest): Promise<Group> {
        const response = await apiClient.post<Group>("/groups", data);
        return response.data;
    },

    /**
     * @param id - group's ID
     * @param data - new data
     * @returns the updated group
     */
    async update(id: number, data: GroupRequest): Promise<Group> {
        const response = await apiClient.put<Group>(
            `/groups/${id}`,
            data,
        );
        return response.data;
    },

    /** @param id - ID of the group to delete */
    async delete(id: number): Promise<void> {
        await apiClient.delete(`/groups/${id}`);
    },
};
