
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
  signup: {
    title: 'Crear cuenta',
    buttonLabel: 'Registrarse',
    loading: 'Registrando...',
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
}
