// Esto de aquí es para la pantalla de recuperar contraseña.

import AppButton from '../components/AppButton.tsx'
import { useForgotPassword } from '../hooks/useForgotPassword.ts'

function ForgotPasswordPage() {
  /*
  const [email, setEmail] = useState('')
  const { submitForgotPassword, loading, error, success } = useForgotPassword()
  */
  const { loading } = useForgotPassword()

  return (
    <section id="forgot-password">
      <h1>Recuperar contraseña</h1>

        <AppButton
          text={loading ? '...' : '...'}
          disabled={loading}
          onClick={() => {}}
        />
     
    </section>
  )
}

export default ForgotPasswordPage
