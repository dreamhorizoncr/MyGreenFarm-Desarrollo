import { apiClient } from './api.ts'
import type { PageResponse } from '../types/page.ts'
import type { PublicTeacher, UserInfo, UpdateUserData } from '../types/auth.ts'

/** User accounts, managed by the owner and admins (`/api/users`). */
export const adminService = {
  /**
   * @param page - page number, starting at 0
   * @param size - users per page
   * @param role - role to filter by; `ALL` or nothing lists every role
   * @param search - text to look for in the name, email and role, optional
   * @returns one page of users
   */
  async getUsers(page = 0, size = 10, role?: string, search?: string): Promise<PageResponse<UserInfo>> {
    const response = await apiClient.get<PageResponse<UserInfo>>('/users', {
      params: { page, size, ...(role && role !== 'ALL' ? { role } : {}), search: search || undefined },
    })
    return response.data
  },

  /**
   * @param id - user's ID
   * @param data - new name, role and profile
   * @returns the updated user
   */
  async updateUser(id: string, data: UpdateUserData): Promise<UserInfo> {
    const response = await apiClient.put<UserInfo>(`/users/${id}`, data)
    return response.data
  },

  /** @param id - ID of the user to delete */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  },

  /** @returns the teachers' accounts */
  async getTeachers(): Promise<UserInfo[]> {
    const response = await apiClient.get<UserInfo[]>('/users/teachers')
    return response.data
  },

  /** @returns the teachers shown on the public About Us page */
  async getAboutUsTeachers(): Promise<PublicTeacher[]> {
    const response = await apiClient.get<PublicTeacher[]>('/users/teachers/about-us')
    return response.data
  },

  /**
   * @param id - teacher's ID
   * @param file - the photo
   * @returns the teacher with the new photo
   */
  async uploadTeacherPhoto(id: string, file: File): Promise<UserInfo> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<UserInfo>(
      `/users/${id}/photo`,
      formData,
    )

    return response.data
  },

  /** @param id - ID of the teacher whose photo is removed */
  async deleteTeacherPhoto(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}/photo`)
  },

}
