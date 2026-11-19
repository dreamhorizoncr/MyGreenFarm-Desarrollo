import { apiClient } from './api.ts'
import type { RegisterData, RegisterResponse, LoginData, LoginResponse, ForgotPasswordRequest, ForgotPasswordResponse, ResetPasswordRequest, ResetPasswordResponse } from '../types/auth.ts'

/** Sign-up, sign-in and password recovery (`/api/auth`). */
export const authService = {
  /**
   * Creates a parent account.
   *
   * @param data - name, email and password
   * @returns the backend's confirmation
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/auth/signup', data)
    return response.data
  },

  /**
   * Signs in. The backend also sets the session cookie.
   *
   * @param data - email and password
   * @returns the token and the user's data
   */
  async login(data: LoginData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/signin', data)
    return response.data
  },

  /** Signs out and makes the backend clear the session cookie. */
  async signout(): Promise<void> {
    await apiClient.post('/auth/signout')
  },

  /**
   * Asks for a password reset email. The answer is the same whether or not the email has an account.
   *
   * @param data - the account's email
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', data)
    return response.data
  },

  /**
   * Sets a new password with the token from the reset email.
   *
   * @param data - token and new password
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await apiClient.post<ResetPasswordResponse>('/auth/reset-password', data)
    return response.data
  },
}
