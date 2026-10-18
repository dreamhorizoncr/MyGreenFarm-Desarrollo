import { apiClient, type PageResponse } from './api.ts'
import type { UserInfo, UpdateUserData } from '../types/auth.ts'

export interface CreateTeacherData {
  firstName: string
  lastName: string
  email: string
  password: string
  birthday?: string | null
}

export const adminService = {
  async getUsers(page = 0, size = 10, role?: string): Promise<PageResponse<UserInfo>> {
    const response = await apiClient.get<PageResponse<UserInfo>>('/users', {
      params: { page, size, ...(role && role !== 'ALL' ? { role } : {}) },
    })
    return response.data
  },

  async updateUser(id: string, data: UpdateUserData): Promise<UserInfo> {
    const response = await apiClient.put<UserInfo>(`/users/${id}`, data)
    return response.data
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  },

  async getTeachers(): Promise<UserInfo[]> {
    const response = await apiClient.get<UserInfo[]>('/users/teachers')
    return response.data
  },

  async createTeacher(data: CreateTeacherData): Promise<void> {
    await apiClient.post('/auth/signup', {
      ...data,
      role: 'TEACHER',
    })
  },

  async uploadTeacherPhoto(id: string, file: File): Promise<UserInfo> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<UserInfo>(
      `/users/${id}/photo`,
      formData,
    )

    return response.data
  },

  async deleteTeacherPhoto(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}/photo`)
  },

}
