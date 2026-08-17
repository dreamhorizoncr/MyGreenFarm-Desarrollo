// Esto de aquí es para la pantalla de crear cuenta (signup).

import { useTranslation } from 'react-i18next'
import Button from '../components/ui/Button.tsx'
import LanguageSwitcher from '../components/LanguageSwitcher.tsx'
import { useRegister } from '../hooks/useRegister.ts'

function SignUpPage() {
  const { t } = useTranslation()
  /*
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { submitRegister, loading, error, success } = useRegister()
  */
  const { loading } = useRegister()
  

  return (
    <section id="signup">
      <h1>{t('signup.title')}</h1>
      <LanguageSwitcher />

        <Button
          loading={loading}
          onClick={() => {}}
        >
          {loading ? t('signup.loading') : t('signup.buttonLabel')}
        </Button>
      

    </section>
  )
}

export default SignUpPage
