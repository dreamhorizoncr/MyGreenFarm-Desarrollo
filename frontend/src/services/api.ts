
import axios from 'axios'
import i18n from '../i18n/index.ts'
import { tokenStorage } from '../utils/token.ts'
import { userStorage } from '../utils/userStorage.ts'

const API_BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api`

/**
 * HTTP client for the backend API (`VITE_API_URL` + `/api`).
 *
 * Every request carries the session token and the current language (`Accept-Language`). When the
 * session has expired it clears it and goes to the login page; any other 401 outside the public routes
 * clears the token and fires the `mgf:unauthorized` window event.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: true
})

/** Adds the session token and the current language to every request. */
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['Accept-Language'] = (i18n.resolvedLanguage ?? i18n.language ?? 'es').split('-')[0]
  return config
})

/** Ends the session when the backend rejects the token. */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.data?.code === 'SESSION_EXPIRED') {
      tokenStorage.clear()
      userStorage.clear()

      if (window.location.pathname !== '/login') {
        window.location.assign('/login?expired=true')
      }

      return Promise.reject(error)
    }

    const url = error.config?.url ?? ''

    const isPublicRoute = url.startsWith('/auth/') || url.includes('/newsletter/subscribe')

    if (error.response?.status === 401 && !isPublicRoute) {
      tokenStorage.clear()
      window.dispatchEvent(new Event('mgf:unauthorized'))
    }
    return Promise.reject(error)
  },
)
