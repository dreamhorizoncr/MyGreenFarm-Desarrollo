export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
}

export interface RegisterResponse {
  message: string
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
}

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
}
