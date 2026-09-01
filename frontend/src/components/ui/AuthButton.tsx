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
      className="h-[43px] w-full rounded-xl bg-green-500 font-body text-[15px] font-normal text-white md:h-[55px] md:text-[17px]"
    >
      {children}
    </Button>
  )
}

export default AuthButton