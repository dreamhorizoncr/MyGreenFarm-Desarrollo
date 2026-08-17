/**
 * Diccionario de textos de la aplicación en inglés.
 * Cada sección (app, signup, forgotPassword, etc.) agrupa las claves
 * de una pantalla o componente específico, para que los nombres de las claves
 * no se repitan en diferentes partes de la aplicación.
 */

export default {
  app: {
    title: 'hello',
    tagline: 'Educational Services',
  },
  languageSwitcher: {
    label: 'Select language',
  },
  signup: {
    title: 'Create account',
    buttonLabel: 'Sign up',
    loading: 'Signing up...',
  },
  forgotPassword: {
    title: 'Recover password',
    buttonLabel: 'Send email',
    loading: 'Sending...',
  },
  common: {
    error: 'An error has occurred',
    retry: 'Retry',
  },
}
