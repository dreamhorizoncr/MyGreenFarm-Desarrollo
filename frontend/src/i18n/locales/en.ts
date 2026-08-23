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
  login: {
    overtitle: 'Administrative Portal',
    title: 'Sign in',
    buttonLabel: 'Sign in',
    loading: 'Signing in...',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot your password?',
    noAccount: "Don't have an account?",
    goToSignup: 'Create account',
  },
  signup: {
    title: 'Create account',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    password: 'Password',
    buttonLabel: 'Sign up',
    loading: 'Signing up...',
    success: 'Account created! You can now sign in.',
    hasAccount: 'Already have an account?',
    goToLogin: 'Sign in',
  },
  forgotPassword: {
    title: 'Recover password',
    description: 'Enter your email and we will send you a link to reset your password.',
    email: 'Email',
    buttonLabel: 'Send email',
    loading: 'Sending...',
    success: 'The recovery email was sent successfully. Please check your inbox.',
    backToLogin: 'Back to sign in',
  },
  common: {
    error: 'An error has occurred',
    retry: 'Retry',
    loading: 'Loading...',
  },
  validation: {
    emailRequired: 'Email is required',
    emailInvalid: 'Enter a valid email',
    passwordRequired: 'Password is required',
    passwordMinLength: 'Password must be at least 8 characters',
    passwordPattern: 'Password must be at least 8 characters with uppercase, lowercase, number and symbol',
    fieldRequired: '{{field}} is required',
  },
  profile: {
    logout: 'Sign out',
    admin: 'User management',
  },
  admin: {
    title: 'User management',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    role: 'Role',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    updated: 'User updated',
    loadError: 'Error loading users',
  },
}
