import type { ReactNode } from 'react'
import Button from './Button.tsx'

interface AuthButtonProps {
  loading: boolean
  children: ReactNode
}

function AuthButton({ loading, children }: AuthButtonProps) {
  return (
    <Button
      type="submit"
      loading={loading}
      variant="success"
      className="h-[55px] w-full rounded-xl bg-green-500 font-body text-[17px] font-normal text-white"
    >
      {children}
    </Button>
  )
}

export default AuthButton