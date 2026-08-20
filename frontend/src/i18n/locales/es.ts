
/**
 * Diccionario de textos de la aplicación en español.
 * Cada sección (app, signup, forgotPassword, etc.) agrupa las claves
 * de una pantalla o componente específico, para que los nombres de las claves
 * no se repitan en diferentes partes de la aplicación.
 */

export default {
  app: {
    title: 'hola',
    tagline: 'Servicios Educativos',
  },
  languageSwitcher: {
    label: 'Seleccionar idioma',
  },
  login: {
    title: 'Iniciar sesión',
    buttonLabel: 'Entrar',
    loading: 'Entrando...',
    email: 'Correo electrónico',
    password: 'Contraseña',
    noAccount: '¿No tenés cuenta?',
    goToSignup: 'Crear cuenta',
  },
  signup: {
    title: 'Crear cuenta',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo electrónico',
    password: 'Contraseña',
    buttonLabel: 'Registrarse',
    loading: 'Registrando...',
    success: '¡Cuenta creada! Ahora podés iniciar sesión.',
    hasAccount: '¿Ya tenés cuenta?',
    goToLogin: 'Iniciar sesión',
  },
  forgotPassword: {
    title: 'Recuperar contraseña',
    buttonLabel: 'Enviar correo',
    loading: 'Enviando...',
  },
  common: {
    error: 'Ha ocurrido un error',
    retry: 'Reintentar',
  },
  validation: {
    emailRequired: 'El correo electrónico es obligatorio',
    emailInvalid: 'Ingresa un correo electrónico válido',
    passwordRequired: 'La contraseña es obligatoria',
    passwordMinLength: 'La contraseña debe tener al menos 8 caracteres',
    passwordPattern: 'La contraseña debe tener al menos 8 caracteres, con mayúscula, minúscula, número y símbolo',
    fieldRequired: 'El {{field}} es obligatorio',
  },
}
