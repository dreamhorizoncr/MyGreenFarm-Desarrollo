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
  login: {
    overtitle: 'Portail Administratif',
    title: 'Se connecter',
    buttonLabel: 'Se connecter',
    loading: 'Connexion...',
    email: 'E-mail',
    password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    noAccount: "Vous n'avez pas de compte ?",
    goToSignup: 'Créer un compte',
  },
  signup: {
    title: 'Créer un compte',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'E-mail',
    password: 'Mot de passe',
    buttonLabel: "S'inscrire",
    loading: 'Inscription...',
    success: 'Compte créé ! Vous pouvez maintenant vous connecter.',
    hasAccount: 'Vous avez déjà un compte ?',
    goToLogin: 'Se connecter',
  },
  forgotPassword: {
    title: 'Récupérer le mot de passe',
    description: 'Entrez votre e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.',
    email: 'E-mail',
    buttonLabel: "Envoyer l'e-mail",
    loading: 'Envoi...',
    success: "L'e-mail de récupération a été envoyé avec succès. Veuillez vérifier votre boîte de réception.",
    backToLogin: 'Retour à la connexion',
  },
  common: {
    error: 'Une erreur est survenue',
    retry: 'Réessayer',
    loading: 'Chargement...',
  },
  validation: {
    emailRequired: "L'e-mail est obligatoire",
    emailInvalid: "Entrez un e-mail valide",
    passwordRequired: 'Le mot de passe est obligatoire',
    passwordMinLength: 'Le mot de passe doit contenir au moins 8 caractères',
    passwordPattern: 'Le mot de passe doit contenir au moins 8 caractères, avec majuscule, minuscule, chiffre et symbole',
    fieldRequired: '{{field}} est obligatoire',
  },
  profile: {
    logout: 'Déconnexion',
    admin: 'Gestion des utilisateurs',
  },
  admin: {
    title: 'Gestion des utilisateurs',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'E-mail',
    role: 'Rôle',
    edit: 'Modifier',
    save: 'Enregistrer',
    cancel: 'Annuler',
    updated: 'Utilisateur mis à jour',
    loadError: 'Erreur lors du chargement',
  },
}
