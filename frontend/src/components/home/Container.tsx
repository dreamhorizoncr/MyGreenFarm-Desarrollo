import type { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
}

function Container({ children, className }: ContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-[var(--container-max-width)] px-1100 ${className ?? ''}`}>
      {children}
    </div>
  )
}

export default Container