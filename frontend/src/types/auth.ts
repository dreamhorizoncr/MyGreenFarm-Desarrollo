export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
  birthday?: string
  showOnAboutUs?: boolean
}

export interface RegisterResponse {
  message: string
  id?: string | null
}

export interface LoginData {
  email: string
  password: string
}

export interface UserInfo {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  birthday?: string | null
  photoUrl?: string | null
  showOnAboutUs?: boolean | null
}

export type PublicTeacher = Pick<UserInfo, 'id' | 'firstName' | 'lastName' | 'role' | 'photoUrl'>

export interface LoginResponse {
  token: string
  user: UserInfo
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface ResetPasswordResponse {
  message: string
}

export interface UpdateUserData {
  firstName: string
  lastName: string
  email: string
  birthday?: string
  showOnAboutUs?: boolean
}
