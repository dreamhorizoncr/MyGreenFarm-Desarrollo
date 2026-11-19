/** Data to create an account. */
export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  /** `OWNER`, `ADMIN`, `TEACHER` or `PARENT`. */
  role: string
  birthday?: string
  /** Whether a teacher appears on the About Us page. */
  showOnAboutUs?: boolean
}

/** Answer to the creation of an account. */
export interface RegisterResponse {
  message: string
  id?: string | null
}

/** Credentials to sign in. */
export interface LoginData {
  email: string
  password: string
}

/** A user account, as the frontend keeps it. */
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

/** A teacher as shown on the public About Us page. */
export type PublicTeacher = Pick<UserInfo, 'id' | 'firstName' | 'lastName' | 'role' | 'photoUrl'>

/** Answer to a successful sign-in. */
export interface LoginResponse {
  token: string
  user: UserInfo
}

/** Request for a password reset email. */
export interface ForgotPasswordRequest {
  email: string
}

/** Answer to a password reset request; the same whether or not the email has an account. */
export interface ForgotPasswordResponse {
  message: string
}

/** New password and the token from the reset email. */
export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

/** Answer to a password change. */
export interface ResetPasswordResponse {
  message: string
}

/** Data to update a user account. */
export interface UpdateUserData {
  firstName: string
  lastName: string
  email: string
  birthday?: string
  showOnAboutUs?: boolean
}
