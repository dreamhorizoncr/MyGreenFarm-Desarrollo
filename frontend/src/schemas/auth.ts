// Esto de aquí es para validar los datos del formulario de registro y de recuperar contraseña.

import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(8, 'Errror...'),
  email: z.email(),
  password: z.string().min(8, 'Erorr...'),
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

