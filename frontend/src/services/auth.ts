import { apiClient } from './api.ts'
import type { RegisterData, RegisterResponse, LoginData, LoginResponse, ForgotPasswordRequest, ForgotPasswordResponse } from '../types/auth.ts'

export const authService = {
  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/auth/signup', data)
    return response.data
  },

  async login(data: LoginData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/signin', data)
    return response.data
  },

  async signout(): Promise<void> {
    await apiClient.post('/auth/signout')
  },

  // Pendiente, el endpoint /auth/forgot-password no existe en el backend todavía
  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', data)
    return response.data
  },
}
