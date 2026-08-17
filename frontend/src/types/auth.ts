// Esto de aquí es para los tipos de datos que se usan en registro y recuperar contraseña.

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface RegisterResponse {
    message: string;
    token: string;
    user: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ForgotPasswordResponse {
    message: string;
    resetToken: string;
}

