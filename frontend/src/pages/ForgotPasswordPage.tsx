// Esto de aquí es para la pantalla de recuperar contraseña.

import { useTranslation } from 'react-i18next'
import Button from '../components/ui/Button.tsx'
import LanguageSwitcher from '../components/LanguageSwitcher.tsx'
import { useForgotPassword } from '../hooks/useForgotPassword.ts'

function ForgotPasswordPage() {
  const { t } = useTranslation()
  /*
  const [email, setEmail] = useState('')
  const { submitForgotPassword, loading, error, success } = useForgotPassword()
  */
  const { loading } = useForgotPassword()

  return (
    <section id="forgot-password">
      <h1>{t('forgotPassword.title')}</h1>
      <LanguageSwitcher />

        <Button
          loading={loading}
          onClick={() => {}}
        >
          {loading ? t('forgotPassword.loading') : t('forgotPassword.buttonLabel')}
        </Button>
     
    </section>
  )
}

export default ForgotPasswordPage
