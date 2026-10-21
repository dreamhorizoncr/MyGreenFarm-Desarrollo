import type { ReactNode } from 'react'
import Button from './Button.tsx'

interface AuthButtonProps {
  loading: boolean
  disabled?: boolean
  children: ReactNode
}

function AuthButton({ loading, disabled = false, children }: Readonly<AuthButtonProps>) {
  return (
    <Button
      type="submit"
      loading={loading}
      disabled={disabled}
      variant="success"
      className="h-11 w-full rounded-full bg-orange-500 font-body text-button font-semibold text-white hover:bg-orange-600"
    >
      {children}
    </Button>
  )
}

export default AuthButton