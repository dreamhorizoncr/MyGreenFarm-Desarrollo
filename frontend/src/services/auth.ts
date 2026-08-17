// Esto de aquí es para llamar al backend: registrar usuario y pedir recuperar contraseña.

import { apiClient } from './api.ts';
import type { RegisterData, RegisterResponse, ForgotPasswordResponse, ForgotPasswordRequest } from '../types/auth.ts';

export const authService = {
  
    async register(data: RegisterData): Promise<RegisterResponse> {
        const response = await apiClient.post<RegisterResponse>('/auth/register', data);
        return response.data;
    },

    async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
        const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', data);
        return response.data;
    },

};
