// Esto de aquí es para guardar y leer el token de sesión en el navegador.

const TOKEN_KEY = 'mgf_token' //modifcable

export const tokenStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY)
  },
}
