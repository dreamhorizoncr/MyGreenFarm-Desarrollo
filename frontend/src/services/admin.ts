import { apiClient } from './api.ts'
import type { UserInfo, UpdateUserData } from '../types/auth.ts'

export const adminService = {
  async getUsers(): Promise<UserInfo[]> {
    const response = await apiClient.get<UserInfo[]>('/users')
    return response.data
  },

  async updateUser(id: string, data: UpdateUserData): Promise<UserInfo> {
    const response = await apiClient.put<UserInfo>(`/users/${id}`, data)
    return response.data
  },
}
