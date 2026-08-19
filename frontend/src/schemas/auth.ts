import { z } from 'zod'

export const registerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  email: z.email(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export const forgotPasswordSchema = z.object({
  email: z.email(),
})
