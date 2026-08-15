// Esto de aquí es para la pantalla de crear cuenta (signup).

import AppButton from '../components/AppButton.tsx'
import { useRegister } from '../hooks/useRegister.ts'

function SignUpPage() {
  /*
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { submitRegister, loading, error, success } = useRegister()
  */
  const { loading } = useRegister()
  

  return (
    <section id="signup">
      <h1>Crear cuenta</h1>

        <AppButton
          text={loading ? '...' : '...'}
          disabled={loading}
          onClick={() => {}}
        />
      

    </section>
  )
}

export default SignUpPage
