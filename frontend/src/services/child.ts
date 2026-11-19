import { apiClient } from "./api";

import type { Child, ChildOption, ChildPage, ChildRequest, ChildStatusFilter } from "../types/child";
import { translateBatch } from "./translation.ts";

/** Children enrolled in the school (`/api/children`). */
export const childService = {
  /**
   * @param page - page number, starting at 0
   * @param size - children per page
   * @param status - active, inactive or all
   * @param search - text to look for in the names, student ID and medical notes, optional
   * @returns one page of children
   */
  async getAll(page = 0, size = 10, status: ChildStatusFilter = "ACTIVE", search?: string): Promise<ChildPage> {
    const response = await apiClient.get<ChildPage>("/children/admin", {
      params: { page, size, status, search: search || undefined },
    });
    return response.data;
  },

  /**
   * @param id - child's ID
   * @returns the child
   */
  async getById(id: number): Promise<Child> {
    const response = await apiClient.get<Child>(`/children/${id}`);
    return response.data;
  },

  /**
   * @param parentId - parent's ID
   * @returns the parent's children
   */
  async getByParent(parentId: number): Promise<ChildPage> {
    const response = await apiClient.get<ChildPage>(
      `/children/parent/${parentId}`,
    );

    return response.data;
  },

  /**
   * @param data - child's data and parent
   * @returns the created child
   */
  async create(data: ChildRequest): Promise<Child> {
    const response = await apiClient.post<Child>("/children", data);
    return response.data;
  },

  /**
   * @param id - child's ID
   * @param data - new data
   * @returns the updated child
   */
  async update(id: number, data: ChildRequest): Promise<Child> {
    const response = await apiClient.put<Child>(`/children/${id}`, data);
    return response.data;
  },

  /**
   * Deactivates a child and removes them from their clubs.
   *
   * @param id - child's ID
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/children/${id}`);
  },

  /** @returns the active children, as options of a selector */
  async getChildrenOptions(): Promise<ChildOption[]> {
    const response = await apiClient.get<ChildOption[]>("/children/options");
    return response.data;
  },

  /** @returns the children that do not have a record yet */
  async getAvailableForExpedient(): Promise<Child[]> {
    const response = await apiClient.get<Child[]>("/children/available-for-expedient");
    return response.data;
  },

  /** @returns the children that do not have a record yet, as options of a selector */
  async getAvailableForExpedientOptions(): Promise<ChildOption[]> {
    const response = await apiClient.get<Child[]>("/children/available-for-expedient");
    return response.data.map((child) => ({
      id: child.id,
      studentId: child.studentId,
      childName: `${child.firstName} ${child.lastName}`,
      fullName: `${child.firstName} ${child.lastName}`,
    }));
  },

  translateBatch,

};
