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
      className="h-[55px] w-full rounded-full bg-green-500 font-body text-button font-normal text-white"
    >
      {children}
    </Button>
  )
}

export default AuthButton