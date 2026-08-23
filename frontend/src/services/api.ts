// Esto de aquí es para el cliente HTTP (axios) que usan todos los servicios: le pone
// el token a cada request y, si el backend responde 401, cierra la sesión.

import axios from 'axios'
import { tokenStorage } from '../utils/token.ts'

const API_BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api`

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? ''
    if (error.response?.status === 401 && !url.startsWith('/auth/')) {
      tokenStorage.clear()
      window.dispatchEvent(new Event('mgf:unauthorized'))
    }
    return Promise.reject(error)
  },
)
