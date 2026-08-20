import { z } from 'zod'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

export const registerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  email: z.email(),
  password: z.string().regex(passwordRegex, 'La contraseña debe tener al menos 8 caracteres, con mayúscula, minúscula, número y símbolo'),
})

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export const forgotPasswordSchema = z.object({
  email: z.email(),
})
