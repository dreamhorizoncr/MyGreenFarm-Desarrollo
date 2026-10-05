import { apiClient, type PageResponse } from './api.ts'
import type { UserInfo, UpdateUserData } from '../types/auth.ts'

export const adminService = {
  async getUsers(page = 0, size = 10): Promise<PageResponse<UserInfo>> {
    const response = await apiClient.get<PageResponse<UserInfo>>('/users', { params: { page, size } })
    return response.data
  },

  async updateUser(id: string, data: UpdateUserData): Promise<UserInfo> {
    const response = await apiClient.put<UserInfo>(`/users/${id}`, data)
    return response.data
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  },
}
