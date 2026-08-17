/**
 * Diccionario de textos de la aplicación en francés.
 * Cada sección (app, signup, forgotPassword, etc.) agrupa las claves
 * de una pantalla o componente específico, para que los nombres de las claves
 * no se repitan en diferentes partes de la aplicación.
 */
export default {
  app: {
    title: 'bonjour',
    tagline: 'Services éducatifs',
  },
  languageSwitcher: {
    label: 'Choisir la langue',
  },
  signup: {
    title: 'Créer un compte',
    buttonLabel: "S'inscrire",
    loading: 'Inscription...',
  },
  forgotPassword: {
    title: 'Récupérer le mot de passe',
    buttonLabel: "Envoyer l'e-mail",
    loading: 'Envoi...',
  },
  common: {
    error: 'Une erreur est survenue',
    retry: 'Réessayer',
  },
}
